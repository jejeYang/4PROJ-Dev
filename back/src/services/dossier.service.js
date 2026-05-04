import DossierRepository from "../repositories/dossier.repository.js";
import CompteRepository from "../repositories/compte.repository.js";
import fs from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { SERVER_FILES_PATH } from '../config/env.js';

class DossierService {
    constructor() {
        this.dossierRepository = new DossierRepository();
        this.compteRepository = new CompteRepository();
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

    async augmenterStockageCompte(idCompte, tailleSupplementaire) {
        const compte = await this.compteRepository.findById(idCompte);
        if (!compte) {
            throw new Error('Compte introuvable pour mise à jour du stockage');
        }

        return await this.compteRepository.update(idCompte, {
            stockageCompte: BigInt(compte.stockageCompte || 0) + BigInt(tailleSupplementaire),
        });
    }

    async calculerTailleRecusive(chemin) {
        const stat = await fs.promises.stat(chemin);
        if (stat.isFile()) {
            return stat.size;
        }

        if (stat.isDirectory()) {
            const entrees = await fs.promises.readdir(chemin, { withFileTypes: true });
            let taille = 0;
            for (const entree of entrees) {
                taille += await this.calculerTailleRecusive(path.join(chemin, entree.name));
            }
            return taille;
        }

        return 0;
    }

    async _genererNomUniqueFichier(dossierPhysique, nomSouhaite) {
        const extension = path.extname(nomSouhaite);
        const base = path.basename(nomSouhaite, extension);
        let candidate = nomSouhaite;
        let compteur = 1;

        while (fs.existsSync(path.join(dossierPhysique, candidate))) {
            compteur += 1;
            candidate = `${base} (${compteur})${extension}`;
        }

        return candidate;
    }

    async _genererNomUniqueDossier(parentId, nomSouhaite) {
        const sousDossiers = await this.recupererSousDossiers(parentId);
        const noms = new Set(sousDossiers.map(d => d.cheminDaccesDossier.toLowerCase()));
        let candidate = nomSouhaite;
        let compteur = 1;

        while (noms.has(candidate.toLowerCase())) {
            compteur += 1;
            candidate = `${nomSouhaite} (${compteur})`;
        }

        return candidate;
    }

    async copierFichierVersCompte(sourceDossierId, fileName, cibleCompteId) {
        const dossierSource = await this.recupererDossierParId(sourceDossierId);
        const cheminSourceRelatif = await this.construireCheminComplet(sourceDossierId);
        const sourcePhysique = path.join(SERVER_FILES_PATH, `user_${dossierSource.idCompteCreateur}`, cheminSourceRelatif);
        const fichierSource = path.join(sourcePhysique, fileName);

        if (!fs.existsSync(fichierSource) || !fs.statSync(fichierSource).isFile()) {
            throw new Error('Fichier source introuvable pour partage');
        }

        const racineCible = await this.recupererDossierRacineParCompte(cibleCompteId);
        if (!racineCible || racineCible.length === 0) {
            throw new Error('Dossier racine de l\'utilisateur cible introuvable');
        }

        const dossierRacineCible = racineCible[0];
        const dossierCiblePhysique = path.join(SERVER_FILES_PATH, `user_${cibleCompteId}`, dossierRacineCible.cheminDaccesDossier);
        if (!fs.existsSync(dossierCiblePhysique)) {
            await mkdir(dossierCiblePhysique, { recursive: true });
        }

        const nouveauNomFichier = await this._genererNomUniqueFichier(dossierCiblePhysique, fileName);
        const destination = path.join(dossierCiblePhysique, nouveauNomFichier);

        try {
            await fs.promises.symlink(fichierSource, destination, 'file');
        } catch (error) {
            await fs.promises.link(fichierSource, destination);
        }

        return {
            chemin: path.join(dossierRacineCible.cheminDaccesDossier, nouveauNomFichier),
            nom: nouveauNomFichier,
            collaboratif: true,
        };
    }

    async copierDossierVersCompte(sourceDossierId, cibleCompteId) {
        const dossierSource = await this.recupererDossierParId(sourceDossierId);
        const cheminSourceRelatif = await this.construireCheminComplet(sourceDossierId);
        const sourcePhysique = path.join(SERVER_FILES_PATH, `user_${dossierSource.idCompteCreateur}`, cheminSourceRelatif);

        if (!fs.existsSync(sourcePhysique) || !fs.statSync(sourcePhysique).isDirectory()) {
            throw new Error('Dossier source introuvable pour partage');
        }

        const racineCible = await this.recupererDossierRacineParCompte(cibleCompteId);
        if (!racineCible || racineCible.length === 0) {
            throw new Error('Dossier racine de l\'utilisateur cible introuvable');
        }

        const dossierRacineCible = racineCible[0];
        const dossierCiblePhysique = path.join(SERVER_FILES_PATH, `user_${cibleCompteId}`, dossierRacineCible.cheminDaccesDossier);
        if (!fs.existsSync(dossierCiblePhysique)) {
            await mkdir(dossierCiblePhysique, { recursive: true });
        }

        const nomCible = await this._genererNomUniqueDossier(dossierRacineCible.idDossier, dossierSource.cheminDaccesDossier);
        const nouveauDossier = await this.dossierRepository.create({
            idCompteCreateur: cibleCompteId,
            idCompteAcces: dossierSource.idCompteCreateur,
            cheminDaccesDossier: nomCible,
            idDossierParent: dossierRacineCible.idDossier,
        });

        const destinationDossierPhysique = path.join(dossierCiblePhysique, nomCible);
        await mkdir(destinationDossierPhysique, { recursive: true });
        await fs.promises.symlink(sourcePhysique, destinationDossierPhysique, 'junction');

        return {
            dossier: nouveauDossier,
            collaboratif: true,
        };
    }

    async _copierDossierRecursif(sourceDossierId, targetDossierId, cibleCompteId) {
        const sourceDossier = await this.recupererDossierParId(sourceDossierId);
        const cheminSourceRelatif = await this.construireCheminComplet(sourceDossierId);
        const sourcePhysique = path.join(SERVER_FILES_PATH, `user_${sourceDossier.idCompteCreateur}`, cheminSourceRelatif);

        const targetDossier = await this.recupererDossierParId(targetDossierId);
        const cheminTargetRelatif = await this.construireCheminComplet(targetDossierId);
        const targetPhysique = path.join(SERVER_FILES_PATH, `user_${cibleCompteId}`, cheminTargetRelatif);

        let tailleTotale = 0;
        const entreePhysique = await fs.promises.readdir(sourcePhysique, { withFileTypes: true });

        for (const entree of entreePhysique) {
            const sourceChemin = path.join(sourcePhysique, entree.name);
            const destinationChemin = path.join(targetPhysique, entree.name);

            if (entree.isFile()) {
                await fs.promises.copyFile(sourceChemin, destinationChemin);
                tailleTotale += await this.calculerTailleRecusive(destinationChemin);
                continue;
            }

            if (entree.isDirectory()) {
                const sousDossierSource = await this.dossierRepository.findFirst({
                    idCompteCreateur: sourceDossier.idCompteCreateur,
                    cheminDaccesDossier: entree.name,
                    idDossierParent: sourceDossierId,
                });

                const nomCible = await this._genererNomUniqueDossier(targetDossierId, entree.name);
                const sousDossierCible = await this.dossierRepository.create({
                    idCompteCreateur: cibleCompteId,
                    cheminDaccesDossier: nomCible,
                    idDossierParent: targetDossierId,
                });

                const sousDestination = path.join(targetPhysique, nomCible);
                await mkdir(sousDestination, { recursive: true });
                tailleTotale += await this._copierDossierRecursif(sousDossierSource.idDossier, sousDossierCible.idDossier, cibleCompteId);
            }
        }

        return tailleTotale;
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
