import prisma from '../prisma.js';
import fs from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { SERVER_FILES_PATH } from '../global_properties.js';

class DtoDossier {
    async creerDossier(dossier) {
        if (!dossier.idCompteCreateur) {
            throw new Error("idCompteCreateur est requis");
        }

        const nomSafe = path.basename(dossier.cheminDaccesDossier);

        const resultat = await prisma.dossier.create({
            data: {
                idCompteCreateur: dossier.idCompteCreateur,
                cheminDaccesDossier: nomSafe,
                idDossierParent: dossier.idDossierParent || null,
            },
        });

        let cheminDossierPhysique;
        if (dossier.idDossierParent) {
            const dossierParent = await this.recupererDossierParId(dossier.idDossierParent);
            cheminDossierPhysique = path.join(
                SERVER_FILES_PATH,
                `user_${dossier.idCompteCreateur}`,
                dossierParent.cheminDaccesDossier,
                nomSafe
            );
        } else {
            cheminDossierPhysique = path.join(
                SERVER_FILES_PATH,
                `user_${dossier.idCompteCreateur}`,
                nomSafe
            );
        }

        await mkdir(cheminDossierPhysique, { recursive: true });

        return resultat;
    }

    async recupererDossiers() {
        return prisma.dossier.findMany();
    }

    async recupererDossierParId(dossierId) {
        return prisma.dossier.findUniqueOrThrow({
            where: { idDossier: Number.parseInt(dossierId) },
        });
    }

    async recupererDossierCompte(idCompteCreateur) {
        return prisma.dossier.findMany({
            where: { idCompteCreateur: Number.parseInt(idCompteCreateur) },
        });
    }

    async recupererSousDossiers(dossierId) {
        return prisma.dossier.findMany({
            where: { idDossierParent: Number.parseInt(dossierId) },
        });
    }

    async recupererDossierRacineParCompte(idCompteCreateur) {
        return prisma.dossier.findMany({
            where: {
                idCompteCreateur: Number.parseInt(idCompteCreateur),
                idDossierParent: null,
            },
        });
    }

    async mettreAJourDossier(dossierId, cheminDaccesDossier) {
        const nomSafe = path.basename(cheminDaccesDossier);
        return prisma.dossier.update({
            where: { idDossier: Number.parseInt(dossierId) },
            data: { cheminDaccesDossier: nomSafe },
        });
    }

    async deplacerDossier(dossierId, idNouveauDossierParent) {
        const dossierSource = await this.recupererDossierParId(dossierId);
        const dossierCible = await this.recupererDossierParId(idNouveauDossierParent);

        if (dossierSource.idCompteCreateur !== dossierCible.idCompteCreateur) {
            throw new Error("Impossible de déplacer vers un dossier n'appartenant pas au même utilisateur.");
        }

        if (Number(dossierId) === Number(idNouveauDossierParent)) {
            throw new Error("Le dossier cible est le même que le dossier source.");
        }

        // Empêche de déplacer un dossier dans l'un de ses propres enfants
        let parentCourant = dossierCible.idDossierParent;
        while (parentCourant) {
            if (Number(parentCourant) === Number(dossierId)) {
                throw new Error("Impossible de déplacer un dossier à l'intérieur de l'un de ses propres sous-dossiers.");
            }
            const parent = await this.recupererDossierParId(parentCourant);
            parentCourant = parent.idDossierParent;
        }

        // Chemins relatifs depuis la racine du user
        const cheminSourceRelatif = await this.construireCheminComplet(dossierId);
        const cheminCibleRelatif = await this.construireCheminComplet(idNouveauDossierParent);

        const basePath = path.join(SERVER_FILES_PATH, `user_${dossierSource.idCompteCreateur}`);
        const cheminAncienPhysique = path.join(basePath, cheminSourceRelatif);
        const cheminNouveauPhysique = path.join(basePath, cheminCibleRelatif, dossierSource.cheminDaccesDossier);

        if (fs.existsSync(cheminNouveauPhysique)) {
            throw new Error(`Un dossier nommé "${dossierSource.cheminDaccesDossier}" existe déjà à cet emplacement.`);
        }

        // Déplacement
        if (fs.existsSync(cheminAncienPhysique)) {
            fs.renameSync(cheminAncienPhysique, cheminNouveauPhysique);
        }
        // Mise à jour bdd
        return prisma.dossier.update({
            where: { idDossier: Number(dossierId) },
            data: { idDossierParent: Number(idNouveauDossierParent) },
        });
    }

    async deplacerFichier(dossierSourceId, nomFichier, idNouveauDossierParent) {
        const dossierSource = await this.recupererDossierParId(dossierSourceId);
        const dossierCible = await this.recupererDossierParId(idNouveauDossierParent);

        if (dossierSource.idCompteCreateur !== dossierCible.idCompteCreateur) {
            throw new Error("Impossible de déplacer vers un dossier n'appartenant pas au même utilisateur.");
        }

        if (Number(dossierSourceId) === Number(idNouveauDossierParent)) {
            throw new Error("Le fichier est déjà dans ce dossier.");
        }

        const cheminSourceRelatif = await this.construireCheminComplet(dossierSourceId);
        const cheminCibleRelatif = await this.construireCheminComplet(idNouveauDossierParent);

        const basePath = path.join(SERVER_FILES_PATH, `user_${dossierSource.idCompteCreateur}`);
        const cheminAncienPhysique = path.join(basePath, cheminSourceRelatif, nomFichier);
        const cheminNouveauPhysique = path.join(basePath, cheminCibleRelatif, nomFichier);

        if (!fs.existsSync(cheminAncienPhysique)) {
            throw new Error(`Le fichier source "${nomFichier}" est introuvable sur le disque.`);
        }

        if (fs.existsSync(cheminNouveauPhysique)) {
            throw new Error(`Un fichier nommé "${nomFichier}" existe déjà dans le dossier de destination.`);
        }

        // S'assure que le dossier cible existe
        if (!fs.existsSync(path.dirname(cheminNouveauPhysique))) {
            await mkdir(path.dirname(cheminNouveauPhysique), { recursive: true });
        }
        fs.renameSync(cheminAncienPhysique, cheminNouveauPhysique);

        return { message: `Fichier '${nomFichier}' déplacé avec succès.`, dossierCibleId: idNouveauDossierParent };
    }

    async supprimerDossier(dossierId) {
        const dossier = await this.recupererDossierParId(dossierId);

        const cheminRelatif = await this.construireCheminComplet(dossierId);
        const chemin = path.join(
            SERVER_FILES_PATH,
            `user_${dossier.idCompteCreateur}`,
            cheminRelatif
        );

        try {
            if (fs.existsSync(chemin)) {
                fs.rmSync(chemin, { recursive: true, force: true });
            }
        } catch (e) {
            console.error("Erreur suppression dossier physique", e);
        }

        return prisma.dossier.delete({
            where: { idDossier: Number.parseInt(dossierId) },
        });
    }

    async televerserFichier(dossierId, file) {
        return {
            message: 'Fichier téléversé avec succès',
            file: {
                originalName: file.originalname,
                filename: file.filename,
                size: file.size,
                mimetype: file.mimetype,
                path: file.path,
            },
            dossierId,
        };
    }

    async supprimerFichier(dossierId, fileName) {
        const dossier = await this.recupererDossierParId(dossierId);

        const cheminComplet = await this.construireCheminComplet(dossierId);
        const cheminPhysique = path.join(SERVER_FILES_PATH, `user_${dossier.idCompteCreateur}`, cheminComplet, fileName);

        if (!fs.existsSync(cheminPhysique)) {
            throw new Error(`Fichier "${fileName}" introuvable dans le dossier id ${dossierId}`);
        }

        const stat = fs.statSync(cheminPhysique);
        if (!stat.isFile()) {
            throw new Error(`Cible "${fileName}" n'est pas un fichier`);
        }

        fs.unlinkSync(cheminPhysique);
        return { message: `Fichier '${fileName}' supprimé`, dossierId, fileName };
    }

    async recupererEndpoints(dossierId) {
        // Fonction non utilisée actuellement, placeholder pour extension future
        return null;
    }

    async construireCheminComplet(dossierId) {
        const dossier = await this.recupererDossierParId(dossierId);

        if (dossier.idDossierParent) {
            // Récursivement construire le chemin du parent
            const cheminParent = await this.construireCheminComplet(dossier.idDossierParent);
            return path.join(cheminParent, dossier.cheminDaccesDossier);
        } else {
            // C'est un dossier racine
            return dossier.cheminDaccesDossier;
        }
    }

    async recupererFichiersDossier(dossierId) {
        try {
            const dossier = await this.recupererDossierParId(dossierId);

            // Construire le chemin physique complet du dossier
            const cheminComplet = await this.construireCheminComplet(dossierId);
            const cheminPhysique = path.join(SERVER_FILES_PATH, `user_${dossier.idCompteCreateur}`, cheminComplet);

            // Lire les fichiers du dossier
            if (!fs.existsSync(cheminPhysique)) {
                return [];
            }

            const fichiers = fs.readdirSync(cheminPhysique).map(nom => {
                const cheminFichier = path.join(cheminPhysique, nom);
                const stat = fs.statSync(cheminFichier);

                if (!stat.isDirectory()) {
                    return {
                        nom: nom,
                        taille: stat.size,
                        dateModification: stat.mtime,
                        type: 'fichier'
                    };
                }
                return null;
            }).filter(f => f !== null);

            return fichiers;
        } catch (error) {
            console.error('Erreur lors de la récupération des fichiers :', error);
            throw error;
        }
    }

    async recupererCorbeille(idCompteCreateur) {
        return prisma.dossier.findFirst({
            where: {
                idCompteCreateur: Number.parseInt(idCompteCreateur),
                cheminDaccesDossier: '.corbeille',
            },
        });
    }

    async recupererDossiersCorbeille(idCompteCreateur) {
        const corbeille = await this.recupererCorbeille(idCompteCreateur);
        if (!corbeille) {
            return [];
        }
        return prisma.dossier.findMany({
            where: {
                idDossierParent: corbeille.idDossier,
            },
        });
    }

    async recupererDossierParChemin(idCompteCreateur, cheminRelatif) {
        const segments = cheminRelatif.split(path.sep).filter(Boolean);
        let parentId = null;
        let current = null;

        for (const segment of segments) {
            current = await prisma.dossier.findFirst({
                where: {
                    idCompteCreateur: Number(idCompteCreateur),
                    cheminDaccesDossier: segment,
                    idDossierParent: parentId,
                },
            });

            if (!current) {
                return null;
            }

            parentId = current.idDossier;
        }

        return current;
    }

    async deplacerVersCorbeille(dossierId, idCompteCreateur) {
        const dossier = await this.recupererDossierParId(dossierId);
        const corbeille = await this.recupererCorbeille(idCompteCreateur);

        if (!corbeille) {
            throw new Error('Corbeille non trouvée pour cet utilisateur');
        }

        const cheminSourceRelatif = await this.construireCheminComplet(dossierId);
        const cheminSourcePhysique = path.join(
            SERVER_FILES_PATH,
            `user_${idCompteCreateur}`,
            cheminSourceRelatif
        );

        const cheminCorbeillePhysique = path.join(
            SERVER_FILES_PATH,
            `user_${idCompteCreateur}`,
            corbeille.cheminDaccesDossier
        );

        if (!fs.existsSync(cheminCorbeillePhysique)) {
            await mkdir(cheminCorbeillePhysique, { recursive: true });
        }

        let cheminDestinationPhysique = path.join(cheminCorbeillePhysique, dossier.cheminDaccesDossier);
        if (fs.existsSync(cheminDestinationPhysique)) {
            const suff = `-${Date.now()}`;
            cheminDestinationPhysique = path.join(cheminCorbeillePhysique, `${dossier.cheminDaccesDossier}${suff}`);
        }

        try {
            if (fs.existsSync(cheminSourcePhysique)) {
                fs.renameSync(cheminSourcePhysique, cheminDestinationPhysique);
            }
        } catch (error) {
            console.error('Erreur lors du déplacement physique du dossier vers la corbeille :', error);
            throw error;
        }

        return prisma.dossier.update({
            where: { idDossier: Number(dossierId) },
            data: {
                idDossierParent: corbeille.idDossier,
                status: cheminSourceRelatif,
            },
        });
    }

    async restaurerDossier(dossierId) {
        const dossier = await this.recupererDossierParId(dossierId);

        const corbeille = await this.recupererCorbeille(dossier.idCompteCreateur);
        if (!corbeille) {
            throw new Error('Corbeille non trouvée pour cet utilisateur');
        }

        if (dossier.idDossierParent !== corbeille.idDossier) {
            throw new Error('Ce dossier n\'est pas dans la corbeille');
        }

        const cheminSourcePhysique = path.join(
            SERVER_FILES_PATH,
            `user_${dossier.idCompteCreateur}`,
            corbeille.cheminDaccesDossier,
            dossier.cheminDaccesDossier
        );

        const cheminDestinationRelatif = dossier.status || dossier.cheminDaccesDossier;
        const cheminDestinationPhysique = path.join(
            SERVER_FILES_PATH,
            `user_${dossier.idCompteCreateur}`,
            cheminDestinationRelatif
        );

        const dossierDestinationParentRelatif = path.dirname(cheminDestinationRelatif);
        let destinationParentId = null;

        if (dossierDestinationParentRelatif && dossierDestinationParentRelatif !== '.' && dossierDestinationParentRelatif !== '/') {
            const parentDossier = await this.recupererDossierParChemin(dossier.idCompteCreateur, dossierDestinationParentRelatif);
            destinationParentId = parentDossier ? parentDossier.idDossier : null;
        }

        if (!fs.existsSync(path.dirname(cheminDestinationPhysique))) {
            await mkdir(path.dirname(cheminDestinationPhysique), { recursive: true });
        }

        let finalDestinationPhysique = cheminDestinationPhysique;
        if (fs.existsSync(finalDestinationPhysique)) {
            const suffix = `-restored-${Date.now()}`;
            finalDestinationPhysique = path.join(path.dirname(cheminDestinationPhysique), `${dossier.cheminDaccesDossier}${suffix}`);
        }

        try {
            if (fs.existsSync(cheminSourcePhysique)) {
                fs.renameSync(cheminSourcePhysique, finalDestinationPhysique);
            }
        } catch (error) {
            console.error('Erreur lors du déplacement physique du dossier vers l\'emplacement restauré :', error);
            throw error;
        }

        return prisma.dossier.update({
            where: { idDossier: Number(dossierId) },
            data: {
                idDossierParent: destinationParentId,
                status: null,
            },
        });
    }

    async deplacerFichierVersCorbeille(dossierId, nomFichier) {
        const dossier = await this.recupererDossierParId(dossierId);
        const corbeille = await this.recupererCorbeille(dossier.idCompteCreateur);

        if (!corbeille) {
            throw new Error('Corbeille non trouvée pour cet utilisateur');
        }

        const cheminSourceRelatif = await this.construireCheminComplet(dossierId);
        const cheminSourcePhysique = path.join(
            SERVER_FILES_PATH,
            `user_${dossier.idCompteCreateur}`,
            cheminSourceRelatif,
            nomFichier
        );

        if (!fs.existsSync(cheminSourcePhysique) || !fs.statSync(cheminSourcePhysique).isFile()) {
            throw new Error(`Fichier '${nomFichier}' introuvable dans le dossier id ${dossierId}`);
        }

        const cheminCorbeillePhysique = path.join(
            SERVER_FILES_PATH,
            `user_${dossier.idCompteCreateur}`,
            corbeille.cheminDaccesDossier
        );

        if (!fs.existsSync(cheminCorbeillePhysique)) {
            await mkdir(cheminCorbeillePhysique, { recursive: true });
        }

        let cheminDestinationPhysique = path.join(cheminCorbeillePhysique, nomFichier);
        if (fs.existsSync(cheminDestinationPhysique)) {
            const ext = path.extname(nomFichier);
            const base = path.basename(nomFichier, ext);
            cheminDestinationPhysique = path.join(cheminCorbeillePhysique, `${base}-${Date.now()}${ext}`);
        }

        fs.renameSync(cheminSourcePhysique, cheminDestinationPhysique);

        return {
            message: `Fichier '${nomFichier}' déplacé vers la corbeille`,
            source: cheminSourcePhysique,
            destination: cheminDestinationPhysique,
            dossierId,
        };
    }

    async restaurerFichierDepuisCorbeille(idCompteCreateur, nomFichier) {
        const corbeille = await this.recupererCorbeille(idCompteCreateur);

        if (!corbeille) {
            throw new Error('Corbeille non trouvée pour cet utilisateur');
        }

        const cheminSourcePhysique = path.join(
            SERVER_FILES_PATH,
            `user_${idCompteCreateur}`,
            corbeille.cheminDaccesDossier,
            nomFichier
        );

        if (!fs.existsSync(cheminSourcePhysique) || !fs.statSync(cheminSourcePhysique).isFile()) {
            throw new Error(`Fichier '${nomFichier}' introuvable dans la corbeille`);
        }

        // Restaurer vers la racine de l'utilisateur (on pourrait améliorer pour restaurer à l'emplacement d'origine)
        const dossierRacine = await prisma.dossier.findFirst({
            where: {
                idCompteCreateur: Number(idCompteCreateur),
                idDossierParent: null,
                cheminDaccesDossier: { not: '.corbeille' },
            },
        });

        let cheminDestinationPhysique;
        if (dossierRacine) {
            const cheminRacinePhysique = path.join(
                SERVER_FILES_PATH,
                `user_${idCompteCreateur}`,
                dossierRacine.cheminDaccesDossier
            );

            if (!fs.existsSync(cheminRacinePhysique)) {
                await mkdir(cheminRacinePhysique, { recursive: true });
            }

            cheminDestinationPhysique = path.join(cheminRacinePhysique, nomFichier);
        } else {
            // Si pas de dossier racine, restaurer directement dans user_X/
            const cheminUserPhysique = path.join(SERVER_FILES_PATH, `user_${idCompteCreateur}`);
            if (!fs.existsSync(cheminUserPhysique)) {
                await mkdir(cheminUserPhysique, { recursive: true });
            }
            cheminDestinationPhysique = path.join(cheminUserPhysique, nomFichier);
        }

        // Gérer les conflits de nom
        if (fs.existsSync(cheminDestinationPhysique)) {
            const ext = path.extname(nomFichier);
            const base = path.basename(nomFichier, ext);
            cheminDestinationPhysique = path.join(path.dirname(cheminDestinationPhysique), `${base}-restored-${Date.now()}${ext}`);
        }

        fs.renameSync(cheminSourcePhysique, cheminDestinationPhysique);

        return {
            message: `Fichier '${nomFichier}' restauré avec succès`,
            source: cheminSourcePhysique,
            destination: cheminDestinationPhysique,
        };
    }

    async supprimerContenuPhysique(cheminCorbeillePhysique) {
        if (!fs.existsSync(cheminCorbeillePhysique)) {
            return;
        }

        const elements = fs.readdirSync(cheminCorbeillePhysique);
        for (const elt of elements) {
            const eltPath = path.join(cheminCorbeillePhysique, elt);
            if (!fs.existsSync(eltPath)) {
                continue;
            }

            const stats = fs.statSync(eltPath);
            if (stats.isDirectory()) {
                fs.rmSync(eltPath, { recursive: true, force: true });
            } else {
                fs.unlinkSync(eltPath);
            }
        }
    }

    async viderCorbeille(idCompteCreateur) {
        const corbeille = await this.recupererCorbeille(idCompteCreateur);
        if (!corbeille) {
            return [];
        }

        const dossiersCorbeille = await prisma.dossier.findMany({
            where: { idDossierParent: corbeille.idDossier },
        });

        const dossiersSupprimes = [];
        for (const dossier of dossiersCorbeille) {
            try {
                await this.supprimerDossier(dossier.idDossier);
                dossiersSupprimes.push(dossier);
            } catch (error) {
                console.error(`Erreur lors de la suppression du dossier ${dossier.idDossier}:`, error);
            }
        }

        try {
            const cheminCorbeillePhysique = path.join(SERVER_FILES_PATH, `user_${idCompteCreateur}`, corbeille.cheminDaccesDossier);
            await this.supprimerContenuPhysique(cheminCorbeillePhysique);
        } catch (error) {
            console.error('Erreur lors du nettoyage des fichiers de la corbeille :', error);
        }

        return dossiersSupprimes;
    }

// Recherche récursive de fichiers dans un dossier et ses sous-dossiers
    async rechercherFichiers(dossierId, query, type) {
        const dossier = await this.recupererDossierParId(dossierId);
        const cheminComplet = await this.construireCheminComplet(dossierId);
        const cheminPhysique = path.join(SERVER_FILES_PATH, `user_${dossier.idCompteCreateur}`, cheminComplet);

        const resultats = { dossiers: [], fichiers: [] };

        if (!fs.existsSync(cheminPhysique)) return resultats;

        // Fonction récursive qui retourne si le dossier (ou un de ses enfants) contient un fichier retenu par la recherche
        const parcourirDossier = async (cheminDir, idDossierCourant) => {
            const elements = fs.readdirSync(cheminDir);
            let aTrouveDesFichiers = false;

            for (const nom of elements) {
                const cheminElement = path.join(cheminDir, nom);
                const stat = fs.statSync(cheminElement);

                if (stat.isDirectory()) {
                    // Cherche le sous-dossier en base pour obtenir son id
                    const sousDossier = await prisma.dossier.findFirst({
                        where: { idDossierParent: idDossierCourant, cheminDaccesDossier: nom }
                    });
                    if (!sousDossier) continue;

                    // Wérifier récursivement ce que contient le sous-dossier
                    const sousDossierValide = await parcourirDossier(cheminElement, sousDossier.idDossier);

                    // Si le sous-dossier contient des fichiers correspondants, on conserve
                    if (sousDossierValide) {
                        resultats.dossiers.push(sousDossier);
                        aTrouveDesFichiers = true;
                    }
                } else {
                    // Filtrer par nom/extension
                    const nomLower = nom.toLowerCase();
                    const queryLower = (query || '').toLowerCase().trim();
                    let match = true;

                    if (queryLower && !nomLower.includes(queryLower)) match = false;

                    // Filtrer par type
                    if (match && type && type !== 'tout') {
                        const ext = nom.split('.').pop().toLowerCase();
                        const types = {
                            images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'jfif'],
                            videos: ['mp4', 'webm'],
                            audio: ['mp3', 'wav', 'm4a', 'ogg'],
                            pdf: ['pdf'],
                            zip: ['zip', 'rar', '7z', 'tar', 'gz'],
                        };
                        if (!types[type]?.includes(ext)) match = false;
                    }

                    if (match) {
                        resultats.fichiers.push({
                            nom,
                            taille: stat.size,
                            dateModification: stat.mtime,
                            type: 'fichier',
                            idDossier: idDossierCourant,
                        });
                        aTrouveDesFichiers = true;
                    }
                }
            }

            return aTrouveDesFichiers;
        };
        await parcourirDossier(cheminPhysique, dossier.idDossier);
        return resultats;
    }

    async recupererTailleDossier(dossierId) {
        try {
            const dossier = await this.recupererDossierParId(dossierId);
            const cheminComplet = await this.construireCheminComplet(dossierId);
            const cheminPhysique = path.join(SERVER_FILES_PATH, `user_${dossier.idCompteCreateur}`, cheminComplet);

            if (!fs.existsSync(cheminPhysique)) {
                return 0;
            }

            const calculerTaille = (cheminDir) => {
                let tailleTotale = 0;
                const fichiers = fs.readdirSync(cheminDir);

                fichiers.forEach(fichier => {
                    const cheminFichier = path.join(cheminDir, fichier);
                    const stat = fs.statSync(cheminFichier);

                    if (stat.isDirectory()) {
                        // Récursivement calculer la taille des sous-dossiers
                        tailleTotale += calculerTaille(cheminFichier);
                    } else {
                        tailleTotale += stat.size;
                    }
                });

                return tailleTotale;
            };

            return calculerTaille(cheminPhysique);
        } catch (error) {
            console.error('Erreur lors de la récupération de la taille du dossier :', error);
            throw error;
        }
    }
}

export default DtoDossier;