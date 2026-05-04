import DossierRepository from "../repositories/dossier.repository.js";
import fs from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { SERVER_FILES_PATH } from '../config/env.js';

class DossierService {
    constructor() {
        this.dossierRepository = new DossierRepository();
    }

    async creerDossier(dossier) {
        if (!dossier.idCompteCreateur) {
            throw new Error("idCompteCreateur est requis");
        }

        const nomSafe = path.basename(dossier.cheminDaccesDossier);

        const resultat = await this.dossierRepository.create({
            idCompteCreateur: dossier.idCompteCreateur,
            cheminDaccesDossier: nomSafe,
            idDossierParent: dossier.idDossierParent || null,
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
        return await this.dossierRepository.findAll();
    }

    async recupererDossierParId(dossierId) {
        return await this.dossierRepository.findById(dossierId);
    }

    async recupererDossiersParCompte(idCompteCreateur) {
        return await this.dossierRepository.findByCompte(idCompteCreateur);
    }

    async recupererSousDossiers(dossierId) {
        return await this.dossierRepository.findSubDossiers(dossierId);
    }

    async recupererDossierRacineParCompte(idCompteCreateur) {
        return await this.dossierRepository.findRootByCompte(idCompteCreateur);
    }

    async mettreAJourDossier(dossierId, cheminDaccesDossier) {
        const nomSafe = path.basename(cheminDaccesDossier);
        return await this.dossierRepository.update(dossierId, { cheminDaccesDossier: nomSafe });
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

        return await this.dossierRepository.delete(dossierId);
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
        return null;
    }

    async construireCheminComplet(dossierId) {
        const dossier = await this.recupererDossierParId(dossierId);

        if (dossier.idDossierParent) {
            const cheminParent = await this.construireCheminComplet(dossier.idDossierParent);
            return path.join(cheminParent, dossier.cheminDaccesDossier);
        } else {
            return dossier.cheminDaccesDossier;
        }
    }

    async recupererFichiersDossier(dossierId) {
        try {
            const dossier = await this.recupererDossierParId(dossierId);

            const cheminComplet = await this.construireCheminComplet(dossierId);
            const cheminPhysique = path.join(SERVER_FILES_PATH, `user_${dossier.idCompteCreateur}`, cheminComplet);

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
        return await this.dossierRepository.findTrash(idCompteCreateur);
    }

    async recupererDossiersCorbeille(idCompteCreateur) {
        const corbeille = await this.recupererCorbeille(idCompteCreateur);
        if (!corbeille) {
            return [];
        }
        return await this.dossierRepository.findSubDossiers(corbeille.idDossier);
    }

    async recupererDossierParChemin(idCompteCreateur, cheminRelatif) {
        const segments = cheminRelatif.split(path.sep).filter(Boolean);
        let parentId = null;
        let current = null;

        for (const segment of segments) {
            current = await this.dossierRepository.findFirst({
                idCompteCreateur: Number(idCompteCreateur),
                cheminDaccesDossier: segment,
                idDossierParent: parentId,
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

        return await this.dossierRepository.update(dossierId, {
            idDossierParent: corbeille.idDossier,
            status: cheminSourceRelatif,
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

        return await this.dossierRepository.update(dossierId, {
            idDossierParent: destinationParentId,
            status: null,
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

        const dossierRacine = await this.dossierRepository.findFirst({
            idCompteCreateur: Number(idCompteCreateur),
            idDossierParent: null,
            cheminDaccesDossier: { not: '.corbeille' },
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
            const cheminUserPhysique = path.join(SERVER_FILES_PATH, `user_${idCompteCreateur}`);
            if (!fs.existsSync(cheminUserPhysique)) {
                await mkdir(cheminUserPhysique, { recursive: true });
            }
            cheminDestinationPhysique = path.join(cheminUserPhysique, nomFichier);
        }

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

        const dossiersCorbeille = await this.dossierRepository.findSubDossiers(corbeille.idDossier);

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

        // Déplacement physique
        if (fs.existsSync(cheminAncienPhysique)) {
            fs.renameSync(cheminAncienPhysique, cheminNouveauPhysique);
        }

        // Mise à jour bdd
        return await this.dossierRepository.update(dossierId, { idDossierParent: Number(idNouveauDossierParent) });
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

        // S'assure que le dossier cible existe physiquement
        if (!fs.existsSync(path.dirname(cheminNouveauPhysique))) {
            await mkdir(path.dirname(cheminNouveauPhysique), { recursive: true });
        }

        fs.renameSync(cheminAncienPhysique, cheminNouveauPhysique);

        return { message: `Fichier '${nomFichier}' déplacé avec succès.`, dossierCibleId: idNouveauDossierParent };
    }

    async rechercherFichiers(dossierId, query, type) {
        const dossier = await this.recupererDossierParId(dossierId);
        const cheminComplet = await this.construireCheminComplet(dossierId);
        const cheminPhysique = path.join(SERVER_FILES_PATH, `user_${dossier.idCompteCreateur}`, cheminComplet);

        const resultats = { dossiers: [], fichiers: [] };

        if (!fs.existsSync(cheminPhysique)) return resultats;

        const parcourirDossier = async (cheminDir, idDossierCourant) => {
            const elements = fs.readdirSync(cheminDir);
            let aTrouveDesFichiers = false;

            for (const nom of elements) {
                const cheminElement = path.join(cheminDir, nom);
                const stat = fs.statSync(cheminElement);

                if (stat.isDirectory()) {
                    const sousDossier = await this.dossierRepository.findFirst({
                        idDossierParent: Number(idDossierCourant),
                        cheminDaccesDossier: nom
                    });

                    if (!sousDossier) continue;

                    const sousDossierValide = await parcourirDossier(cheminElement, sousDossier.idDossier);

                    if (sousDossierValide) {
                        resultats.dossiers.push(sousDossier);
                        aTrouveDesFichiers = true;
                    }
                } else {
                    const nomLower = nom.toLowerCase();
                    const queryLower = (query || '').toLowerCase().trim();
                    let match = true;

                    if (queryLower && !nomLower.includes(queryLower)) match = false;

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

export default DossierService;
