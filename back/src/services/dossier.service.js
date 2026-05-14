import DossierRepository from "../repositories/dossier.repository.js";
import CompteRepository from "../repositories/compte.repository.js";
import LienService from "./lien.service.js";
import fs from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { SERVER_FILES_PATH } from '../config/env.js';

class DossierService {
    constructor() {
        this.dossierRepository = new DossierRepository();
        this.compteRepository = new CompteRepository();
        this.lienService = new LienService();
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
            const cheminParentComplet = await this.construireCheminComplet(dossier.idDossierParent);
            cheminDossierPhysique = path.join(
                SERVER_FILES_PATH,
                `user_${dossier.idCompteCreateur}`,
                cheminParentComplet,
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

    async mettreAJourDossier(dossierId, nouveauNom) {
        const dossier = await this.recupererDossierParId(dossierId);
        const idCompte = dossier.idCompteCreateur;
        
        // Sécurisation du nom pour éviter les problèmes de chemin et de sécurité
        const nomSafe = path.basename(nouveauNom).trim();
        if (nomSafe === dossier.cheminDaccesDossier) return dossier;

        // Construit les chemins physiques (Ancien vs Nouveau)
        const cheminRelatifAncien = await this.construireCheminComplet(dossierId);
        const cheminPhysiqueAncien = path.join(SERVER_FILES_PATH, `user_${idCompte}`, cheminRelatifAncien);
        
        // Le dossier parent reste le même, on change juste le dernier segment
        const cheminParentRelatif = path.dirname(cheminRelatifAncien);
        const cheminPhysiqueNouveau = path.join(SERVER_FILES_PATH, `user_${idCompte}`, cheminParentRelatif, nomSafe);

        if (fs.existsSync(cheminPhysiqueNouveau)) {
            throw new Error(`Un élément nommé "${nomSafe}" existe déjà à cet emplacement.`);
        }

        // Renommage physique
        if (fs.existsSync(cheminPhysiqueAncien)) {
            try {
                fs.renameSync(cheminPhysiqueAncien, cheminPhysiqueNouveau);
            } catch (err) {
                throw new Error(`Erreur lors du renommage physique : ${err.message}`);
            }
        }

        // Mise à jour en Base de données
        return await this.dossierRepository.update(dossierId, { 
            cheminDaccesDossier: nomSafe,
            modifieLe: new Date() 
        });
    }

    async supprimerDossier(dossierId) {
        const dossierASupprimer = await this.recupererDossierParId(dossierId);

        // Récupérer tous les dossiers liés à ce partage (la source + les copies)
        const idOriginal = dossierASupprimer.idDossierSource || dossierASupprimer.idDossier;
        const instancesADelete = [Number(idOriginal)];
        const copies = await this.dossierRepository.findMany({
            idDossierSource: Number(idOriginal)
        });
        instancesADelete.push(...copies.map(c => Number(c.idDossier)));

        const idsUniques = [...new Set(instancesADelete)];

        // Procéder à la suppression pour chaque instance trouvée
        for (const id of idsUniques) {
            const dossier = await this.recupererDossierParId(id);
            const tailleDossier = await this.recupererTailleDossier(id);

            // Suppression des liens de partage publics associés
            const idsDescendants = [id, ...(await this.recupererIdsDescendants(id))];
            for (const descId of idsDescendants) {
                await this.lienService.supprimerLiensDossier(descId);
            }

            // Suppression physique
            const cheminRelatif = await this.construireCheminComplet(id);
            const cheminPhysique = path.join(SERVER_FILES_PATH, `user_${dossier.idCompteCreateur}`, cheminRelatif);

            try {
                let statsCible = null;
                // lstatSync pour détecter les liens morts
                try { statsCible = fs.lstatSync(cheminPhysique); } catch (err) {}

                if (statsCible) {
                    if (statsCible.isSymbolicLink()) {
                        fs.unlinkSync(cheminPhysique);
                    } else {
                        fs.rmSync(cheminPhysique, { recursive: true, force: true });
                    }
                }
            } catch (e) {
                console.error(`Erreur suppression physique pour dossier ${id}:`, e);
            }

            await this.dossierRepository.delete(id);

            // Mise à jour du quota pour le propriétaire
            const compte = await this.compteRepository.findById(dossier.idCompteCreateur);
            if (compte) {
                await this.compteRepository.update(dossier.idCompteCreateur, {
                    stockageCompte: BigInt(compte.stockageCompte) + BigInt(tailleDossier)
                });
            }
        }

        return { message: "Ressource supprimée globalement pour tous les participants.", instancesSupprimees: idsUniques.length };
    }

    async televerserFichier(dossierId, file, idUtilisateur) {
        // Mettre à jour le quota (décrémenter car stockageCompte est le quota restant)
        const compte = await this.compteRepository.findById(idUtilisateur);
        if (!compte) throw new Error("Compte non trouvé");

        const nouvelleTaille = BigInt(compte.stockageCompte) - BigInt(file.size);
        if (nouvelleTaille < 0n) {
            throw new Error("Espace de stockage insuffisant");
        }

        await this.compteRepository.update(idUtilisateur, {
            stockageCompte: nouvelleTaille
        });

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

        // Suppression des liens de partage associés à ce fichier
        await this.lienService.supprimerLienFichier(dossierId, fileName);

        const cheminComplet = await this.construireCheminComplet(dossierId);
        const cheminPhysique = path.join(SERVER_FILES_PATH, `user_${dossier.idCompteCreateur}`, cheminComplet, fileName);

        if (!fs.existsSync(cheminPhysique)) {
            throw new Error(`Fichier "${fileName}" introuvable dans le dossier id ${dossierId}`);
        }

        const stat = fs.statSync(cheminPhysique);
        if (!stat.isFile()) {
            throw new Error(`Cible "${fileName}" n'est pas un fichier`);
        }

        const fileSize = stat.size;
        fs.unlinkSync(cheminPhysique);

        // Restaurer le quota
        const compte = await this.compteRepository.findById(dossier.idCompteCreateur);
        if (compte) {
            await this.compteRepository.update(dossier.idCompteCreateur, {
                stockageCompte: BigInt(compte.stockageCompte) + BigInt(fileSize)
            });
        }

        return { message: `Fichier '${fileName}' supprimé`, dossierId, fileName };
    }

    async renommerFichier(dossierId, ancienNom, nouveauNom) {
    const dossier = await this.recupererDossierParId(dossierId);
    const cheminRelatif = await this.construireCheminComplet(dossierId);
    const dossierPhysique = path.join(SERVER_FILES_PATH, `user_${dossier.idCompteCreateur}`, cheminRelatif);

    const ancienChemin = path.join(dossierPhysique, ancienNom);
    const nouveauChemin = path.join(dossierPhysique, nouveauNom);

    if (!fs.existsSync(ancienChemin)) {
        throw new Error(`Le fichier "${ancienNom}" n'existe pas.`);
    }

    if (fs.existsSync(nouveauChemin)) {
        throw new Error(`Un fichier nommé "${nouveauNom}" existe déjà.`);
    }

    // Renommage physique
    fs.renameSync(ancienChemin, nouveauChemin);

    // Mise à jour de la date de modification du dossier parent en DB
    await this.dossierRepository.update(dossierId, { modifieLe: new Date() });

    return { message: "Fichier renommé avec succès", ancienNom, nouveauNom };
}

    async recuperedpoints(dossierId) {
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

    async recupererIdsDescendants(dossierId) {
        const sousDossiers = await this.recupererSousDossiers(dossierId);
        let ids = sousDossiers.map(d => Number(d.idDossier));
        for (const sd of sousDossiers) {
            const subIds = await this.recupererIdsDescendants(sd.idDossier);
            ids = ids.concat(subIds);
        }
        return ids;
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
                if (nom === '.trash-meta.json') {
                    return null;
                }

                const cheminFichier = path.join(cheminPhysique, nom);
                try {
                    const stat = fs.statSync(cheminFichier);
                    if (!stat.isDirectory()) {
                        return {
                            nom: nom,
                            taille: stat.size,
                            dateCreation: stat.birthtime || stat.ctime,
                            dateModification: stat.mtime,
                            type: 'fichier'
                        };
                    }
                } catch (e) {
                    return null;
                }
                return null;
            }).filter(f => f !== null);

            return fichiers;
        } catch (error) {
            console.error('Erreur lors de la récupération des fichiers :', error);
            throw error;
        }
    }

    async estDescendant(dossierId, ancetreId) {
        if (parseInt(dossierId) === parseInt(ancetreId)) return true;
        
        try {
            let current = await this.recupererDossierParId(dossierId);
            while (current && current.idDossierParent) {
                if (current.idDossierParent === parseInt(ancetreId)) return true;
                current = await this.recupererDossierParId(current.idDossierParent);
            }
        } catch (error) {
            return false;
        }
        return false;
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

    async recupererHomeStats(idCompte) {
        const compte = await this.compteRepository.findById(idCompte);
        if (!compte) throw new Error("Compte non trouvé");

        const quotaTotal = 32212254720n; // 30 Go
        const stockageUtilise = quotaTotal - BigInt(compte.stockageCompte);

        // Récupérer tous les dossiers pour le mapping
        const tousLesDossiersDB = await this.dossierRepository.findByCompte(idCompte);
        // Trouver le dossier racine "user_x"
        const dossierRacine = tousLesDossiersDB.find(d => d.idDossierParent === null && d.cheminDaccesDossier !== '.corbeille');
        
        const allFiles = [];
        const allFolders = [];

        const scanDir = async (dirPath, currentParentId) => {
            if (!fs.existsSync(dirPath)) return;
            const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                // Ignore les fichiers systèmes et la corbeille
                if (entry.name === '.trash-meta.json' || entry.name === '.corbeille') continue;

                const fullPath = path.join(dirPath, entry.name);
                const stats = await fs.promises.stat(fullPath);

                if (entry.isDirectory()) {
                    // ID de ce sous-dossier en DB
                    const dossierDB = tousLesDossiersDB.find(d => 
                        d.cheminDaccesDossier === entry.name && Number(d.idDossierParent) === Number(currentParentId)
                    );
                    
                    if (dossierDB) {
                        allFolders.push({ 
                            idDossier: dossierDB.idDossier, 
                            nom: entry.name, 
                            mtime: stats.mtime.getTime()
                        });
                        // Récursion dans le sous-dossier
                        await scanDir(fullPath, dossierDB.idDossier);
                    }
                } else {
                    // Ajoute le fichier trouvé à la liste
                    allFiles.push({
                        nom: entry.name,
                        taille: stats.size,
                        atime: stats.atime.getTime(),
                        idDossierParent: currentParentId
                    });
                }
            }
        };

        if (dossierRacine) {
            // Commence le scan dans le dossier racine physique
            const cheminPhysiqueRacine = path.join(SERVER_FILES_PATH, `user_${idCompte}`, dossierRacine.cheminDaccesDossier);
            await scanDir(cheminPhysiqueRacine, dossierRacine.idDossier);
        }

        return {
            stockage: {
                total: Number(quotaTotal),
                utilise: Number(stockageUtilise)
            },
            derniersDossiers: allFolders.sort((a, b) => b.mtime - a.mtime).slice(0, 5),
            derniersFichiers: allFiles.sort((a, b) => b.atime - a.atime).slice(0, 5),
            plusGrosFichiers: allFiles.sort((a, b) => b.taille - a.taille).slice(0, 5),
            tousLesFichiers: allFiles.map(f => f.nom)
        };
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

    async copierDossierVersCompte(sourceDossierId, cibleCompteId) {
        const dossierSource = await this.recupererDossierParId(sourceDossierId);
        const cheminSourceRelatif = await this.construireCheminComplet(sourceDossierId);

        const partageExistant = await this.dossierRepository.findFirst({
            idCompteCreateur: cibleCompteId,
            idDossierSource: Number(sourceDossierId)
        });

        if (partageExistant) {
            throw new Error("Ce dossier est déjà partagé avec cet utilisateur.");
        }

        const sourcePhysique = path.resolve(
            SERVER_FILES_PATH,
            `user_${dossierSource.idCompteCreateur}`,
            cheminSourceRelatif
        );

        if (!fs.existsSync(sourcePhysique) || !fs.statSync(sourcePhysique).isDirectory()) {
            throw new Error('Dossier source introuvable pour partage');
        }

        const racineCible = await this.recupererDossierRacineParCompte(cibleCompteId);
        if (!racineCible || racineCible.length === 0) {
            throw new Error('Dossier racine de l\'utilisateur cible introuvable');
        }

        const dossierRacineCible = racineCible[0];

        const dossierCiblePhysique = path.resolve(
            SERVER_FILES_PATH,
            `user_${cibleCompteId}`,
            dossierRacineCible.cheminDaccesDossier
        );

        await fs.promises.mkdir(dossierCiblePhysique, { recursive: true });

        // On ajoute le suffixe -partage par défaut pour la clarté
        const nomBase = `${dossierSource.cheminDaccesDossier}-partage`;
        const nomCible = await this._genererNomUniqueDossier(
            dossierRacineCible.idDossier,
            nomBase
        );

        const destinationDossierPhysique = path.join(dossierCiblePhysique, nomCible);

        if (fs.existsSync(destinationDossierPhysique)) {
            throw new Error(`Le dossier cible "${nomCible}" existe déjà physiquement`);
        }

        // Création en base avec la traçabilité robuste (idDossierSource)
        const nouveauDossier = await this.dossierRepository.create({
            idCompteCreateur: cibleCompteId,
            idCompteAcces: dossierSource.idCompteCreateur,
            idDossierSource: Number(sourceDossierId),
            cheminDaccesDossier: nomCible,
            idDossierParent: dossierRacineCible.idDossier,
        });

        try {
            // Utilisation d'un lien symbolique/junction pour ne pas dupliquer la taille sur le disque
            // et permettre une vraie synchronisation bidirectionnelle
            const typeLien = process.platform === 'win32' ? 'junction' : 'dir';

            await fs.promises.symlink(
                sourcePhysique,
                destinationDossierPhysique,
                typeLien
            );

            return {
                dossier: nouveauDossier,
                chemin: path.join(dossierRacineCible.cheminDaccesDossier, nomCible),
                nom: nomCible,
                collaboratif: true,
            };
        } catch (error) {
            await this.dossierRepository.delete(nouveauDossier.idDossier);
            throw new Error(
                `Erreur lors de la création du lien collaboratif du dossier partagé : ${error.message}`
            );
        }
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

    async _getCheminMetaCorbeille(idCompteCreateur) {
        const corbeille = await this.recupererCorbeille(idCompteCreateur);
        if (!corbeille) {
            throw new Error('Corbeille non trouvée pour cet utilisateur');
        }

        const cheminCorbeilleRelatif = await this.construireCheminComplet(corbeille.idDossier);

        return path.join(
            SERVER_FILES_PATH,
            `user_${idCompteCreateur}`,
            cheminCorbeilleRelatif,
            '.trash-meta.json'
        );
    }

    async _lireMetaCorbeille(idCompteCreateur) {
        try {
            const cheminMeta = await this._getCheminMetaCorbeille(idCompteCreateur);

            if (!fs.existsSync(cheminMeta)) {
                return {};
            }

            const contenu = await fs.promises.readFile(cheminMeta, 'utf8');
            return JSON.parse(contenu);
        } catch (error) {
            console.error('Erreur lecture métadonnées corbeille :', error);
            return {};
        }
    }

    async _ecrireMetaCorbeille(idCompteCreateur, meta) {
        const cheminMeta = await this._getCheminMetaCorbeille(idCompteCreateur);
        await mkdir(path.dirname(cheminMeta), { recursive: true });
        await fs.promises.writeFile(cheminMeta, JSON.stringify(meta, null, 2), 'utf8');
    }

    async _dossierExistePourUtilisateur(idDossier, idCompteCreateur) {
        if (!idDossier) {
            return false;
        }

        try {
            const dossier = await this.recupererDossierParId(idDossier);
            return Boolean(dossier && Number(dossier.idCompteCreateur) === Number(idCompteCreateur));
        } catch {
            return false;
        }
    }

    async _recupererDossierRacineUtilisateur(idCompteCreateur) {
        const dossiersRacine = await this.recupererDossierRacineParCompte(idCompteCreateur);
        if (Array.isArray(dossiersRacine) && dossiersRacine.length > 0) {
            return dossiersRacine.find(dossier => dossier.cheminDaccesDossier !== '.corbeille') || dossiersRacine[0];
        }

        const dossiersUtilisateur = await this.recupererDossiersParCompte(idCompteCreateur);
        if (!Array.isArray(dossiersUtilisateur) || dossiersUtilisateur.length === 0) {
            return null;
        }

        return dossiersUtilisateur.find(dossier => !dossier.idDossierParent && dossier.cheminDaccesDossier !== '.corbeille')
            || dossiersUtilisateur.find(dossier => dossier.cheminDaccesDossier !== '.corbeille')
            || dossiersUtilisateur[0];
    }

    async _getIdDossierDestinationRestauration(idCompteCreateur, idDossierOrigine, idDossierFallback) {
        const origineExiste = await this._dossierExistePourUtilisateur(idDossierOrigine, idCompteCreateur);
        if (origineExiste) {
            return Number(idDossierOrigine);
        }

        const fallbackExiste = await this._dossierExistePourUtilisateur(idDossierFallback, idCompteCreateur);
        if (fallbackExiste) {
            return Number(idDossierFallback);
        }

        const dossierRacine = await this._recupererDossierRacineUtilisateur(idCompteCreateur);
        return dossierRacine?.idDossier || null;
    }

    async deplacerVersCorbeille(dossierId, idCompteCreateur) {
        const dossier = await this.recupererDossierParId(dossierId);
        const corbeille = await this.recupererCorbeille(idCompteCreateur);

        if (!corbeille) {
            throw new Error('Corbeille non trouvée pour cet utilisateur');
        }

        // Supprime les liens publics associés à ce dossier et à tous ses sous-dossiers
        const idsDescendants = [Number(dossierId), ...(await this.recupererIdsDescendants(dossierId))];
        for (const descId of idsDescendants) {
            await this.lienService.supprimerLiensDossier(descId);
        }

        // Supprime les copies chez les destinataires
        if (!dossier.idDossierSource) {
            const copies = await this.dossierRepository.findMany({
                idDossierSource: Number(dossierId)
            });
            
            for (const copie of copies) {
                // Enlève les liens publics que le destinataire aurait pu générer sur sa copie
                const copyDescendants = [Number(copie.idDossier), ...(await this.recupererIdsDescendants(copie.idDossier))];
                for (const descId of copyDescendants) {
                    await this.lienService.supprimerLiensDossier(descId);
                }

                // Supprime les lien de partage chez le destinataire
                const cheminRelatifCopie = await this.construireCheminComplet(copie.idDossier);
                const cheminPhysiqueCopie = path.join(SERVER_FILES_PATH, `user_${copie.idCompteCreateur}`, cheminRelatifCopie);
                try {
                    let statsCopie = null;
                    try { statsCopie = fs.lstatSync(cheminPhysiqueCopie); } catch(e){}
                    
                    if (statsCopie) {
                        if (statsCopie.isSymbolicLink()) {
                            fs.unlinkSync(cheminPhysiqueCopie);
                        } else {
                            fs.rmSync(cheminPhysiqueCopie, { recursive: true, force: true });
                        }
                    }
                } catch (e) {
                    console.error(`Erreur suppression physique pour copie partagée ${copie.idDossier}:`, e);
                }

                // Supprime le dossier de la base de données du destinataire
                await this.dossierRepository.delete(copie.idDossier);
            }
        }

        const cheminSourceRelatif = await this.construireCheminComplet(dossierId);
        const cheminSourcePhysique = path.join(SERVER_FILES_PATH, `user_${idCompteCreateur}`, cheminSourceRelatif);

        const cheminCorbeilleRelatif = await this.construireCheminComplet(corbeille.idDossier);
        const cheminCorbeillePhysique = path.join(SERVER_FILES_PATH, `user_${idCompteCreateur}`, cheminCorbeilleRelatif);

        if (!fs.existsSync(cheminCorbeillePhysique)) {
            await mkdir(cheminCorbeillePhysique, { recursive: true });
        }

        let nomFinalDossier = dossier.cheminDaccesDossier;
        let cheminDestinationPhysique = path.join(cheminCorbeillePhysique, nomFinalDossier);
        
        // Si un dossier avec ce nom existe déjà dans la corbeille, on modifie le nom
        if (fs.existsSync(cheminDestinationPhysique)) {
            const suff = `-${Date.now()}`;
            nomFinalDossier = `${dossier.cheminDaccesDossier}${suff}`;
            cheminDestinationPhysique = path.join(cheminCorbeillePhysique, nomFinalDossier);
        }

        try {
            let sourceExists = false;
            try { fs.lstatSync(cheminSourcePhysique); sourceExists = true; } catch(e){}
            if (sourceExists) {
                fs.renameSync(cheminSourcePhysique, cheminDestinationPhysique);
            }
        } catch (error) {
            console.error('Erreur lors du déplacement physique du dossier vers la corbeille :', error);
            throw error;
        }

        return await this.dossierRepository.update(dossierId, {
            idDossierParent: corbeille.idDossier,
            status: cheminSourceRelatif,
            cheminDaccesDossier: nomFinalDossier 
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

        const cheminCorbeilleRelatif = await this.construireCheminComplet(corbeille.idDossier);
        const cheminSourcePhysique = path.join(
            SERVER_FILES_PATH,
            `user_${dossier.idCompteCreateur}`,
            cheminCorbeilleRelatif,
            dossier.cheminDaccesDossier
        );

        let cheminDestinationRelatif = dossier.status || dossier.cheminDaccesDossier;
        const dossierDestinationParentRelatif = path.dirname(cheminDestinationRelatif);
        let destinationParentId = null;

        if (dossierDestinationParentRelatif && dossierDestinationParentRelatif !== '.' && dossierDestinationParentRelatif !== '/') {
            const parentDossier = await this.recupererDossierParChemin(dossier.idCompteCreateur, dossierDestinationParentRelatif);
            destinationParentId = parentDossier ? parentDossier.idDossier : null;
        }

        const dossierRacine = await this._recupererDossierRacineUtilisateur(dossier.idCompteCreateur);
        if (!destinationParentId) {
            destinationParentId = dossierRacine?.idDossier || null;
            const dossierRacineChemin = destinationParentId
                ? await this.construireCheminComplet(destinationParentId)
                : '';
            cheminDestinationRelatif = path.join(
                dossierRacineChemin,
                dossier.cheminDaccesDossier
            );
        }

        const cheminDestinationPhysique = path.join(
            SERVER_FILES_PATH,
            `user_${dossier.idCompteCreateur}`,
            cheminDestinationRelatif
        );

        const parentDestinationPhysique = path.dirname(cheminDestinationPhysique);
        if (!fs.existsSync(parentDestinationPhysique)) {
            await mkdir(parentDestinationPhysique, { recursive: true });
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

    async deplacerFichierVersCorbeille(dossierId, nomFichier, options = {}) {
        const dossier = await this.recupererDossierParId(dossierId);
        const corbeille = await this.recupererCorbeille(dossier.idCompteCreateur);

        if (!corbeille) {
            throw new Error('Corbeille non trouvée pour cet utilisateur');
        }

        await this.lienService.supprimerLienFichier(dossierId, nomFichier);

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

        const cheminCorbeilleRelatif = await this.construireCheminComplet(corbeille.idDossier);
        const cheminCorbeillePhysique = path.join(
            SERVER_FILES_PATH,
            `user_${dossier.idCompteCreateur}`,
            cheminCorbeilleRelatif
        );

        if (!fs.existsSync(cheminCorbeillePhysique)) {
            await mkdir(cheminCorbeillePhysique, { recursive: true });
        }

        let nomDansCorbeille = nomFichier;
        let cheminDestinationPhysique = path.join(cheminCorbeillePhysique, nomDansCorbeille);

        if (fs.existsSync(cheminDestinationPhysique)) {
            const ext = path.extname(nomFichier);
            const base = path.basename(nomFichier, ext);
            nomDansCorbeille = `${base}-${Date.now()}${ext}`;
            cheminDestinationPhysique = path.join(cheminCorbeillePhysique, nomDansCorbeille);
        }

        fs.renameSync(cheminSourcePhysique, cheminDestinationPhysique);

        const meta = await this._lireMetaCorbeille(dossier.idCompteCreateur);
        meta[nomDansCorbeille] = {
            type: 'fichier',
            nomOriginal: nomFichier,
            nomDansCorbeille,
            idDossierParentOrigine: options.idDossierParentOrigine || Number(dossierId),
            cheminSourceRelatif,
            dateSuppression: new Date().toISOString(),
        };

        await this._ecrireMetaCorbeille(dossier.idCompteCreateur, meta);

        return {
            message: `Fichier '${nomFichier}' déplacé vers la corbeille`,
            source: cheminSourcePhysique,
            destination: cheminDestinationPhysique,
            dossierId,
            nom: nomDansCorbeille,
            nomOriginal: nomFichier,
            idDossierParentOrigine: options.idDossierParentOrigine || Number(dossierId),
        };
    }

    async restaurerFichierDepuisCorbeille(idCompteCreateur, nomFichier, options = {}) {
        const corbeille = await this.recupererCorbeille(idCompteCreateur);

        if (!corbeille) {
            throw new Error('Corbeille non trouvée pour cet utilisateur');
        }

        const cheminCorbeilleRelatif = await this.construireCheminComplet(corbeille.idDossier);
        const cheminSourcePhysique = path.join(
            SERVER_FILES_PATH,
            `user_${idCompteCreateur}`,
            cheminCorbeilleRelatif,
            nomFichier
        );

        if (!fs.existsSync(cheminSourcePhysique) || !fs.statSync(cheminSourcePhysique).isFile()) {
            throw new Error(`Fichier '${nomFichier}' introuvable dans la corbeille`);
        }

        const meta = await this._lireMetaCorbeille(idCompteCreateur);
        const metaFichier = meta[nomFichier];

        const idDossierDestination = await this._getIdDossierDestinationRestauration(
            idCompteCreateur,
            metaFichier?.idDossierParentOrigine,
            options.idDossierParentFallback
        );

        if (!idDossierDestination) {
            throw new Error('Impossible de trouver un dossier de destination pour la restauration');
        }

        const dossierDestination = await this.recupererDossierParId(idDossierDestination);
        const cheminDestinationRelatif = await this.construireCheminComplet(idDossierDestination);
        const dossierDestinationPhysique = path.join(
            SERVER_FILES_PATH,
            `user_${dossierDestination.idCompteCreateur}`,
            cheminDestinationRelatif
        );

        if (!fs.existsSync(dossierDestinationPhysique)) {
            await mkdir(dossierDestinationPhysique, { recursive: true });
        }

        const nomOriginal = metaFichier?.nomOriginal || nomFichier;
        const nomFinal = await this._genererNomUniqueFichier(dossierDestinationPhysique, nomOriginal);
        const cheminDestinationPhysique = path.join(dossierDestinationPhysique, nomFinal);

        fs.renameSync(cheminSourcePhysique, cheminDestinationPhysique);

        if (meta[nomFichier]) {
            delete meta[nomFichier];
            await this._ecrireMetaCorbeille(idCompteCreateur, meta);
        }

        return {
            message: `Fichier '${nomOriginal}' restauré avec succès`,
            source: cheminSourcePhysique,
            destination: cheminDestinationPhysique,
            nom: nomFinal,
            nomOriginal,
            idDossierParent: idDossierDestination,
            restaureDansDossierOrigine: Boolean(metaFichier?.idDossierParentOrigine)
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

        // Supprimer tous les dossiers qui sont dans la corbeille (cela restaure déjà leur quota via supprimerDossier)
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

        // Restaurer le quota pour les fichiers "orphelins" (fichiers mis à la corbeille sans dossier parent)
        try {
            const cheminCorbeilleRelatif = await this.construireCheminComplet(corbeille.idDossier);
            const cheminCorbeillePhysique = path.join(SERVER_FILES_PATH, `user_${idCompteCreateur}`, cheminCorbeilleRelatif);
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

        let parentCourant = dossierCible.idDossierParent;
        while (parentCourant) {
            if (Number(parentCourant) === Number(dossierId)) {
                throw new Error("Impossible de déplacer un dossier à l'intérieur de l'un de ses propres sous-dossiers.");
            }
            const parent = await this.recupererDossierParId(parentCourant);
            parentCourant = parent.idDossierParent;
        }

        const cheminSourceRelatif = await this.construireCheminComplet(dossierId);
        const cheminCibleRelatif = await this.construireCheminComplet(idNouveauDossierParent);

        const basePath = path.join(SERVER_FILES_PATH, `user_${dossierSource.idCompteCreateur}`);
        const cheminAncienPhysique = path.join(basePath, cheminSourceRelatif);
        const cheminNouveauPhysique = path.join(basePath, cheminCibleRelatif, dossierSource.cheminDaccesDossier);

        if (fs.existsSync(cheminNouveauPhysique)) {
            throw new Error(`Un dossier nommé "${dossierSource.cheminDaccesDossier}" existe déjà à cet emplacement.`);
        }

        if (fs.existsSync(cheminAncienPhysique)) {
            fs.renameSync(cheminAncienPhysique, cheminNouveauPhysique);
        }

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
                if (nom === '.trash-meta.json') {
                    continue;
                }

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
                            dateCreation: stat.birthtime || stat.ctime,
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
                    if (fichier === '.trash-meta.json') {
                        return;
                    }

                    const cheminFichier = path.join(cheminDir, fichier);
                    try {
                        const stat = fs.statSync(cheminFichier);
                        if (stat.isDirectory()) {
                            tailleTotale += calculerTaille(cheminFichier);
                        } else {
                            tailleTotale += stat.size;
                        }
                    } catch (e) {
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