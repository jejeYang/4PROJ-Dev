import DossierService from '../services/dossier.service.js';
import path from 'node:path';
import fs, { promises as fsPromises } from 'node:fs';
import archiver from 'archiver';
import { SERVER_FILES_PATH } from '../config/env.js';
import { 
    parserListeChemins, 
    resoudreCheminSecurise, 
    construireNomArchiveUtilisateur, 
    genererNomUniqueZip 
} from '../utils/file.utils.js';

class DossierController {
    constructor() {
        this.dossierService = new DossierService();
    }

    // ===== CRUD DOSSIERS =====

    createDossier = async (req, res, next) => {
        try {
            const { cheminDaccesDossier, idDossierParent } = req.body;
            const idUtilisateurAuthentifie = +req.utilisateur.id;

            if (!cheminDaccesDossier) {
                return res.status(400).json({ error: 'cheminDaccesDossier est requis' });
            }

            const dossiersUtilisateur = await this.dossierService.recupererDossiersParCompte(idUtilisateurAuthentifie);
            if (!dossiersUtilisateur || dossiersUtilisateur.length === 0) {
                return res.status(404).json({ error: 'Dossier personnel non trouvé' });
            }
            
            let dossierParentId = dossiersUtilisateur[0].idDossier;

            if (idDossierParent) {
                const dossierParent = await this.dossierService.recupererDossierParId(idDossierParent);
                if (dossierParent.idCompteCreateur !== idUtilisateurAuthentifie) {
                    return res.status(403).json({ error: 'Le dossier parent ne vous appartient pas' });
                }
                dossierParentId = idDossierParent;
            }

            let dossiersExistants = [];
            if (dossierParentId) {
                dossiersExistants = await this.dossierService.recupererSousDossiers(dossierParentId);
            } else {
                dossiersExistants = await this.dossierService.recupererDossierRacineParCompte(idUtilisateurAuthentifie);
            }

            const nomExisteDeja = dossiersExistants.some(
                d => d.cheminDaccesDossier.toLowerCase() === cheminDaccesDossier.trim().toLowerCase()
            );

            if (nomExisteDeja) {
                return res.status(409).json({ error: 'Un dossier portant ce nom existe déjà à cet emplacement.' });
            }

            const dossier = { 
                idCompteCreateur: idUtilisateurAuthentifie, 
                cheminDaccesDossier, 
                idDossierParent: dossierParentId 
            };

            const resultat = await this.dossierService.creerDossier(dossier);
            res.status(201).json(resultat);
        } catch (error) {
            next(error);
        }
    };

    getDossiers = async (req, res, next) => {
        try {
            const dossiers = await this.dossierService.recupererDossiers();
            res.json(dossiers);
        } catch (error) {
            next(error);
        }
    };

    getDossierById = async (req, res, next) => {
        try {
            const { dossierId } = req.params;
            const dossier = await this.dossierService.recupererDossierParId(dossierId);
            res.json(dossier);
        } catch (error) {
            next(error);
        }
    };

    getDossiersByCompte = async (req, res, next) => {
        try {
            const { idCompteCreateurDossier } = req.params;
            const dossiers = await this.dossierService.recupererDossierRacineParCompte(idCompteCreateurDossier);
            res.json(dossiers);
        } catch (error) {
            next(error);
        }
    };

    getSousDossiers = async (req, res, next) => {
        try {
            const { dossierId } = req.params;
            const sousDossiers = await this.dossierService.recupererSousDossiers(dossierId);
            res.json(sousDossiers);
        } catch (error) {
            next(error);
        }
    };

    getFichiersDossier = async (req, res, next) => {
        try {
            const { dossierId } = req.params;
            const fichiers = await this.dossierService.recupererFichiersDossier(dossierId);
            res.json(fichiers);
        } catch (error) {
            next(error);
        }
    };

    deleteFichier = async (req, res, next) => {
        try {
            const { dossierId, fileName } = req.params;
            const idUtilisateurAuthentifie = +req.utilisateur.id;

            const dossier = await this.dossierService.recupererDossierParId(dossierId);
            if (dossier.idCompteCreateur !== idUtilisateurAuthentifie) {
                return res.status(403).json({ error: 'Ce dossier ne vous appartient pas' });
            }

            const resultat = await this.dossierService.supprimerFichier(dossierId, decodeURIComponent(fileName));
            res.json(resultat);
        } catch (error) {
            next(error);
        }
    };

    getTailleDossier = async (req, res, next) => {
        try {
            const { dossierId } = req.params;
            const taille = await this.dossierService.recupererTailleDossier(dossierId);
            res.json({ dossierId, taille });
        } catch (error) {
            next(error);
        }
    };

    updateDossier = async (req, res, next) => {
        try {
            const { dossierId } = req.params;
            const { cheminDaccesDossier } = req.body;
            const idUtilisateurAuthentifie = +req.utilisateur.id;

            if (!cheminDaccesDossier) {
                return res.status(400).json({ error: 'cheminDaccesDossier est requis' });
            }

            const dossier = await this.dossierService.recupererDossierParId(dossierId);
            if (dossier.idCompteCreateur !== idUtilisateurAuthentifie) {
                return res.status(403).json({ error: 'Ce dossier ne vous appartient pas' });
            }

            let dossiersExistants = [];
            if (dossier.idDossierParent) {
                dossiersExistants = await this.dossierService.recupererSousDossiers(dossier.idDossierParent);
            } else {
                dossiersExistants = await this.dossierService.recupererDossierRacineParCompte(idUtilisateurAuthentifie);
            }

            const nomExisteDeja = dossiersExistants.some(
                d => d.cheminDaccesDossier.toLowerCase() === cheminDaccesDossier.trim().toLowerCase()
                    && d.idDossier !== Number(dossierId)
            );

            if (nomExisteDeja) {
                return res.status(409).json({ error: 'Un dossier portant ce nom existe déjà à cet emplacement.' });
            }

            const resultat = await this.dossierService.mettreAJourDossier(dossierId, cheminDaccesDossier.trim());
            res.json(resultat);
        } catch (error) {
            next(error);
        }
    };

    deleteDossier = async (req, res, next) => {
        try {
            const { dossierId } = req.params;
            const idUtilisateurAuthentifie = +req.utilisateur.id;

            const dossier = await this.dossierService.recupererDossierParId(dossierId);
            if (dossier.idCompteCreateur !== idUtilisateurAuthentifie) {
                return res.status(403).json({ error: 'Ce dossier ne vous appartient pas' });
            }

            const resultat = await this.dossierService.supprimerDossier(dossierId);
            res.json(resultat);
        } catch (error) {
            next(error);
        }
    };

    deplacerDossier = async (req, res, next) => {
        try {
            const { dossierId } = req.params;
            const { idNouveauDossierParent } = req.body;
            const idUtilisateurAuthentifie = +req.utilisateur.id;

            if (!idNouveauDossierParent) {
                return res.status(400).json({ error: 'idNouveauDossierParent est requis' });
            }

            const dossierSource = await this.dossierService.recupererDossierParId(dossierId);
            if (dossierSource.idCompteCreateur !== idUtilisateurAuthentifie) {
                return res.status(403).json({ error: 'Le dossier source ne vous appartient pas' });
            }

            const dossierCible = await this.dossierService.recupererDossierParId(idNouveauDossierParent);
            if (dossierCible.idCompteCreateur !== idUtilisateurAuthentifie) {
                return res.status(403).json({ error: 'Le dossier de destination ne vous appartient pas' });
            }

            const resultat = await this.dossierService.deplacerDossier(dossierId, idNouveauDossierParent);
            res.json(resultat);
        } catch (error) {
            console.error('Erreur lors du déplacement du dossier :', error);
            const status = error.message.includes('existe déjà') || error.message.includes('sous-dossiers') ? 409 : 500;
            res.status(status).json({ error: error.message || 'Erreur lors du déplacement' });
        }
    };

    deplacerFichier = async (req, res, next) => {
        try {
            const { dossierId, nomFichier } = req.params;
            const { idNouveauDossierParent } = req.body;
            const idUtilisateurAuthentifie = +req.utilisateur.id;

            if (!idNouveauDossierParent) {
                return res.status(400).json({ error: 'idNouveauDossierParent est requis' });
            }

            const dossierSource = await this.dossierService.recupererDossierParId(dossierId);
            if (dossierSource.idCompteCreateur !== idUtilisateurAuthentifie) {
                return res.status(403).json({ error: 'Le dossier source ne vous appartient pas' });
            }

            const dossierCible = await this.dossierService.recupererDossierParId(idNouveauDossierParent);
            if (dossierCible.idCompteCreateur !== idUtilisateurAuthentifie) {
                return res.status(403).json({ error: 'Le dossier de destination ne vous appartient pas' });
            }

            const nomFichierDecode = decodeURIComponent(nomFichier);
            const resultat = await this.dossierService.deplacerFichier(dossierId, nomFichierDecode, idNouveauDossierParent);
            res.json(resultat);
        } catch (error) {
            console.error('Erreur lors du déplacement du fichier :', error);
            const status = error.message.includes('existe déjà') ? 409 : 500;
            res.status(status).json({ error: error.message || 'Erreur lors du déplacement' });
        }
    };

    rechercherFichiers = async (req, res, next) => {
        try {
            const { dossierId } = req.params;
            const { q, type } = req.query;
            const idUtilisateurAuthentifie = +req.utilisateur.id;

            const dossier = await this.dossierService.recupererDossierParId(dossierId);
            if (dossier.idCompteCreateur !== idUtilisateurAuthentifie) {
                return res.status(403).json({ error: 'Ce dossier ne vous appartient pas' });
            }

            const resultats = await this.dossierService.rechercherFichiers(dossierId, q, type);
            res.json(resultats);
        } catch (error) {
            console.error('Erreur lors de la recherche :', error);
            res.status(500).json({ error: error.message || 'Erreur lors de la recherche' });
        }
    };

    // ===== GESTION DES FICHIERS =====

    getFichier = async (req, res, next) => {
        try {
            const { nomFichier } = req.params;
            const idUtilisateurAuthentifie = +req.utilisateur.id;

            if (req.idCompteCreateur !== idUtilisateurAuthentifie) {
                return res.status(403).json({ error: 'Ce dossier ne vous appartient pas' });
            }

            const cheminDossierPhysique = path.join(SERVER_FILES_PATH, `user_${req.idCompteCreateur}`, req.cheminDossier);
            const cheminFichierPhysique = path.join(cheminDossierPhysique, nomFichier);

            if (!fs.existsSync(cheminFichierPhysique)) {
                return res.status(404).json({ error: 'Fichier introuvable sur le serveur' });
            }

            res.sendFile(cheminFichierPhysique);
        } catch (error) {
            next(error);
        }
    };

    televerserFichier = async (req, res, next) => {
        try {
            const { dossierId } = req.params;
            const idUtilisateurAuthentifie = +req.utilisateur.id;
            
            if (!req.file) {
                return res.status(400).json({ error: 'Aucun fichier fourni' });
            }

            if (req.idCompteCreateur !== idUtilisateurAuthentifie) {
                await fsPromises.unlink(req.file.path).catch(() => {});
                return res.status(403).json({ error: 'Ce dossier ne vous appartient pas' });
            }

            const fichiersExistants = await this.dossierService.recupererFichiersDossier(dossierId);
            const nomExiste = fichiersExistants.some(f => f.nom.toLowerCase() === req.file.originalname.toLowerCase());

            if (nomExiste) {
                await fsPromises.unlink(req.file.path).catch(() => {});
                return res.status(409).json({ error: `Le fichier "${req.file.originalname}" existe déjà dans ce dossier.` });
            }

            const cheminDossierPhysique = path.join(SERVER_FILES_PATH, `user_${req.idCompteCreateur}`, req.cheminDossier);
            
            if (!fs.existsSync(cheminDossierPhysique)) {
                fs.mkdirSync(cheminDossierPhysique, { recursive: true });
            }
            
            const ancienChemin = req.file.path;
            const nouveauChemin = path.join(cheminDossierPhysique, req.file.filename);
            
            fs.renameSync(ancienChemin, nouveauChemin);
            req.file.path = nouveauChemin;

            const resultat = await this.dossierService.televerserFichier(dossierId, req.file);
            res.status(201).json(resultat);
        } catch (error) {
            next(error);
        }
    };

    televerserMultipleFichiers = async (req, res, next) => {
        try {
            const { dossierId } = req.params;
            const idUtilisateurAuthentifie = +req.utilisateur.id;
            
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: 'Aucun fichier fourni' });
            }

            if (req.idCompteCreateur !== idUtilisateurAuthentifie) {
                await Promise.all(req.files.map(f => fsPromises.unlink(f.path).catch(() => {})));
                return res.status(403).json({ error: 'Ce dossier ne vous appartient pas' });
            }

            const fichiersExistants = await this.dossierService.recupererFichiersDossier(dossierId);
            const nomsFichiersExistants = new Set(fichiersExistants.map(f => f.nom.toLowerCase()));
            
            const fichiersEnConflit = req.files.filter(f => nomsFichiersExistants.has(f.originalname.toLowerCase()));

            if (fichiersEnConflit.length > 0) {
                await Promise.all(req.files.map(f => fsPromises.unlink(f.path).catch(() => {})));
                const nomsConflits = fichiersEnConflit.map(f => f.originalname).join(', ');
                return res.status(409).json({ error: `Ce(s) fichier(s) existe(nt) déjà dans ce dossier : ${nomsConflits}` });
            }

            const cheminDossierPhysique = path.join(SERVER_FILES_PATH, `user_${req.idCompteCreateur}`, req.cheminDossier);
            
            if (!fs.existsSync(cheminDossierPhysique)) {
                fs.mkdirSync(cheminDossierPhysique, { recursive: true });
            }
            
            const fichiersDeplaces = req.files.map(file => {
                const ancienChemin = file.path;
                const nouveauChemin = path.join(cheminDossierPhysique, file.filename);
                fs.renameSync(ancienChemin, nouveauChemin);
                file.path = nouveauChemin;
                return file;
            });

            const resultats = await Promise.all(
                fichiersDeplaces.map(file => this.dossierService.televerserFichier(dossierId, file))
            );

            res.status(201).json({ message: 'Fichiers téléversés avec succès', files: resultats });
        } catch (error) {
            next(error);
        }
    };

    telechargerZip = async (req, res, next) => {
        try {
            const idUtilisateurAuthentifie = +req.utilisateur.id;
            const listeFichier = parserListeChemins(req.query.listeFichier ?? req.body?.listeFichier);
            const listeDossier = parserListeChemins(req.query.listeDossier ?? req.body?.listeDossier);

            if (listeFichier.length === 0 && listeDossier.length === 0) {
                return res.status(400).json({ error: 'Aucun chemin de fichier ou de dossier fourni' });
            }

            const baseUtilisateur = path.join(SERVER_FILES_PATH, `user_${idUtilisateurAuthentifie}`);
            if (!fs.existsSync(baseUtilisateur)) {
                return res.status(404).json({ error: 'Espace de fichiers utilisateur introuvable' });
            }

            const fichiersValides = [];
            const dossiersValides = [];
            const dejaAjoutes = new Set();

            for (const cheminFichier of listeFichier) {
                const cheminSecurise = resoudreCheminSecurise(baseUtilisateur, cheminFichier);
                if (!cheminSecurise) continue;

                const cle = `f:${cheminSecurise.relatif.toLowerCase()}`;
                if (dejaAjoutes.has(cle)) continue;

                const stat = await fsPromises.stat(cheminSecurise.absolu).catch(() => null);
                if (!stat || !stat.isFile()) continue;

                dejaAjoutes.add(cle);
                fichiersValides.push(cheminSecurise);
            }

            for (const cheminDossier of listeDossier) {
                const cheminSecurise = resoudreCheminSecurise(baseUtilisateur, cheminDossier);
                if (!cheminSecurise) continue;

                const cle = `d:${cheminSecurise.relatif.toLowerCase()}`;
                if (dejaAjoutes.has(cle)) continue;

                const stat = await fsPromises.stat(cheminSecurise.absolu).catch(() => null);
                if (!stat || !stat.isDirectory()) continue;

                dejaAjoutes.add(cle);
                dossiersValides.push(cheminSecurise);
            }

            if (fichiersValides.length === 0 && dossiersValides.length === 0) {
                return res.status(404).json({ error: 'Aucun fichier ou dossier valide trouvé' });
            }

            const nomArchive = `${construireNomArchiveUtilisateur(req.utilisateur, idUtilisateurAuthentifie)}.zip`;
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${nomArchive}"`);

            const archive = archiver('zip', { zlib: { level: 9 } });

            archive.on('error', (archiveError) => {
                console.error('Erreur lors de la création de l\'archive ZIP :', archiveError);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Erreur lors de la création de l\'archive ZIP' });
                    return;
                }
                res.destroy(archiveError);
            });

            archive.pipe(res);
            const nomsUtilisesDansZip = new Set();

            for (const fichier of fichiersValides) {
                const nomFichier = path.basename(fichier.relatif);
                const nomEntree = genererNomUniqueZip(nomFichier, nomsUtilisesDansZip);
                if (!nomEntree) continue;

                archive.file(fichier.absolu, { name: nomEntree });
            }

            for (const dossier of dossiersValides) {
                const nomDossier = path.basename(dossier.relatif);
                const nomEntree = genererNomUniqueZip(nomDossier, nomsUtilisesDansZip);
                if (!nomEntree) continue;

                archive.directory(dossier.absolu, nomEntree);
            }

            await archive.finalize();
        } catch (error) {
            next(error);
        }
    };

    // ===== GESTION DE LA CORBEILLE =====

    getCorbeille = async (req, res, next) => {
        try {
            const idUtilisateurAuthentifie = +req.utilisateur.id;
            const dossiersCorbeille = await this.dossierService.recupererDossiersCorbeille(idUtilisateurAuthentifie);
            res.json(dossiersCorbeille);
        } catch (error) {
            next(error);
        }
    };

    deplacerVersCorbeille = async (req, res, next) => {
        try {
            const { dossierId } = req.params;
            const idUtilisateurAuthentifie = +req.utilisateur.id;

            const dossier = await this.dossierService.recupererDossierParId(dossierId);
            if (dossier.idCompteCreateur !== idUtilisateurAuthentifie) {
                return res.status(403).json({ error: 'Ce dossier ne vous appartient pas' });
            }

            if (dossier.cheminDaccesDossier === '.corbeille') {
                return res.status(400).json({ error: 'Impossible de supprimer la corbeille' });
            }

            const resultat = await this.dossierService.deplacerVersCorbeille(
                dossierId,
                idUtilisateurAuthentifie,
                { idDossierParentOrigine: dossier.idDossierParent }
            );

            res.json({ message: 'Dossier déplacé à la corbeille', dossier: resultat });
        } catch (error) {
            next(error);
        }
    };

    deplacerFichierVersCorbeille = async (req, res, next) => {
        try {
            const { dossierId, nomFichier } = req.params;
            const idUtilisateurAuthentifie = +req.utilisateur.id;

            const dossier = await this.dossierService.recupererDossierParId(dossierId);
            if (dossier.idCompteCreateur !== idUtilisateurAuthentifie) {
                return res.status(403).json({ error: 'Ce dossier ne vous appartient pas' });
            }

            const nomFichierDecode = decodeURIComponent(nomFichier);

            const resultat = await this.dossierService.deplacerFichierVersCorbeille(
                dossierId,
                nomFichierDecode,
                {
                    idDossierParentOrigine: Number(dossierId),
                    idCompte: idUtilisateurAuthentifie
                }
            );

            res.json({ message: 'Fichier déplacé à la corbeille', fichier: resultat });
        } catch (error) {
            next(error);
        }
    };

    restaurerDossier = async (req, res, next) => {
        try {
            const { dossierId } = req.params;
            const idUtilisateurAuthentifie = +req.utilisateur.id;

            const dossier = await this.dossierService.recupererDossierParId(dossierId);
            if (dossier.idCompteCreateur !== idUtilisateurAuthentifie) {
                return res.status(403).json({ error: 'Ce dossier ne vous appartient pas' });
            }

            const corbeille = await this.dossierService.recupererCorbeille(idUtilisateurAuthentifie);
            if (dossier.idDossierParent !== corbeille.idDossier) {
                return res.status(400).json({ error: 'Ce dossier n\'est pas dans la corbeille' });
            }

            const dossierRacine = await this._recupererDossierRacineUtilisateur(idUtilisateurAuthentifie);

            const resultat = await this.dossierService.restaurerDossier(
                dossierId,
                {
                    idCompte: idUtilisateurAuthentifie,
                    idDossierParentFallback: dossierRacine?.idDossier
                }
            );

            res.json({ message: 'Dossier restauré avec succès', dossier: resultat });
        } catch (error) {
            next(error);
        }
    };

    restaurerFichier = async (req, res, next) => {
        try {
            const { nomFichier } = req.params;
            const idUtilisateurAuthentifie = +req.utilisateur.id;

            const dossierRacine = await this._recupererDossierRacineUtilisateur(idUtilisateurAuthentifie);

            const resultat = await this.dossierService.restaurerFichierDepuisCorbeille(
                idUtilisateurAuthentifie,
                decodeURIComponent(nomFichier),
                {
                    idCompte: idUtilisateurAuthentifie,
                    idDossierParentFallback: dossierRacine?.idDossier
                }
            );

            res.json({ message: 'Fichier restauré avec succès', fichier: resultat });
        } catch (error) {
            next(error);
        }
    };

    viderCorbeille = async (req, res, next) => {
        try {
            const idUtilisateurAuthentifie = +req.utilisateur.id;
            const resultat = await this.dossierService.viderCorbeille(idUtilisateurAuthentifie);
            res.json({ message: 'Corbeille vidée avec succès', dossiersSupprimes: resultat });
        } catch (error) {
            next(error);
        }
    };

    _recupererDossierRacineUtilisateur = async (idUtilisateur) => {
        const dossiersUtilisateur = await this.dossierService.recupererDossiersParCompte(idUtilisateur);
        if (!dossiersUtilisateur || dossiersUtilisateur.length === 0) {
            return null;
        }

        return dossiersUtilisateur.find(dossier => !dossier.idDossierParent && dossier.cheminDaccesDossier !== '.corbeille')
            || dossiersUtilisateur.find(dossier => dossier.cheminDaccesDossier !== '.corbeille')
            || dossiersUtilisateur[0];
    };
}

export default new DossierController();