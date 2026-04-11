import express from 'express';
import ServiceDossier from '../metier/dossier.js';
import { authentifierToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'node:path';
import fs, { promises as fsPromises } from 'node:fs';
import archiver from 'archiver';
import { SERVER_FILES_PATH } from '../global_properties.js';

const dossierRouter = express.Router();

// Configuration de multer avec destination dynamique
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // La destination sera déterminée dans le middleware
        console.log('Chemin temporaire pour le fichier:', SERVER_FILES_PATH);
        cb(null, SERVER_FILES_PATH);
    },
    filename: (req, file, cb) => {
        // Garder le nom original du fichier
        cb(null, file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50 MB max
    }
});

// Middleware de vérification du dossier avant téléversement
// Fonction pour construire le chemin complet d'un dossier en remontant les parents
const construireCheminComplet = async (dossierId, service_dossier) => {
    const dossier = await service_dossier.recupererDossierParId(dossierId);
    
    if (dossier.idDossierParent) {
        // Récursivement construire le chemin du parent
        const cheminParent = await construireCheminComplet(dossier.idDossierParent, service_dossier);
        return path.join(cheminParent, dossier.cheminDaccesDossier);
    } else {
        // C'est un dossier racine
        return dossier.cheminDaccesDossier;
    }
};

const verifierDossierExiste = async (req, res, next) => {
    try {
        const { dossierId } = req.params;
        const service_dossier = new ServiceDossier();
        const dossier = await service_dossier.recupererDossierParId(dossierId);
        // Stocker l'ID du dossier, l'ID du créateur et le chemin d'accès complet dans la requête
        req.dossierId = dossier.idDossier;
        req.idCompteCreateur = dossier.idCompteCreateur;
        req.cheminDossier = await construireCheminComplet(dossierId, service_dossier);
        next();
    } catch (error) {
        console.error('Erreur lors de la vérification du dossier :', error);
        res.status(404).json({ error: 'Le dossier n\'existe pas' });
    }
};

// Routes protégées

// ===== CRUD DOSSIERS =====

// CREATE - Créer un nouveau dossier
dossierRouter.post('/api/dossiers', authentifierToken, async (req, res) => {
    try {
        const { cheminDaccesDossier, idDossierParent } = req.body;
        const idUtilisateurAuthentifie = +req.utilisateur.id;

        if (!cheminDaccesDossier) {
            return res.status(400).json({ error: 'cheminDaccesDossier est requis' });
        }

        const service_dossier = new ServiceDossier();
        
        // Récupérer le dossier personnel de l'utilisateur
        const dossiersUtilisateur = await service_dossier.recupererDossiersParCompte(idUtilisateurAuthentifie);
        if (!dossiersUtilisateur || dossiersUtilisateur.length === 0) {
            return res.status(404).json({ error: 'Dossier personnel non trouvé' });
        }
        
        let dossierParentId = dossiersUtilisateur[0].idDossier; // Par défaut, le dossier personnel

        // Si un dossier parent est spécifié, vérifier qu'il appartient à l'utilisateur
        if (idDossierParent) {
            const dossierParent = await service_dossier.recupererDossierParId(idDossierParent);
            if (dossierParent.idCompteCreateur !== idUtilisateurAuthentifie) {
                return res.status(403).json({ error: 'Le dossier parent ne vous appartient pas' });
            }
            dossierParentId = idDossierParent;
        }

        // Vérifier qu'il n'existe pas déjà un dossier avec le même nom dans le même dossier parent
        let dossiersExistants = [];
        if (dossierParentId) {
            dossiersExistants = await service_dossier.recupererSousDossiers(dossierParentId);
        } else {
            dossiersExistants = await service_dossier.recupererDossierRacineParCompte(idUtilisateurAuthentifie);
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
        const resultat = await service_dossier.creerDossier(dossier);
        res.status(201).json(resultat);
    } catch (error) {
        console.error('Erreur lors de la création du dossier :', error);
        res.status(500).json({ error: error.message || 'Erreur lors de la création' });
    }
});

// READ - Récupérer tous les dossiers
dossierRouter.get('/api/dossiers', authentifierToken, async (req, res) => {
    try {
        const service_dossier = new ServiceDossier();
        const dossiers = await service_dossier.recupererDossiers();
        res.json(dossiers);
    } catch (error) {
        console.error('Erreur lors de la récupération des dossiers :', error);
        res.status(500).json({ error: error.message || 'Erreur lors de la récupération' });
    }
});

// READ - Récupérer un dossier par ID
dossierRouter.get('/api/dossiers/:dossierId', authentifierToken, async (req, res) => {
    try {
        const { dossierId } = req.params;
        const service_dossier = new ServiceDossier();
        const dossier = await service_dossier.recupererDossierParId(dossierId);
        res.json(dossier);
    } catch (error) {
        console.error('Erreur lors de la récupération du dossier :', error);
        res.status(500).json({ error: error.message || 'Erreur lors de la récupération' });
    }
});

// READ - Récupérer les dossiers d'un compte
dossierRouter.get('/api/comptes/:idCompteCreateurDossier/dossiers', authentifierToken, async (req, res) => {
    try {
        const { idCompteCreateurDossier } = req.params;
        const service_dossier = new ServiceDossier();
        // Récupérer uniquement les dossiers racine (sans parent)
        const dossiers = await service_dossier.recupererDossierRacineParCompte(idCompteCreateurDossier);
        res.json(dossiers);
    } catch (error) {
        console.error('Erreur lors de la récupération des dossiers :', error);
        res.status(500).json({ error: error.message || 'Erreur lors de la récupération' });
    }
});

// READ - Récupérer les sous-dossiers d'un dossier
dossierRouter.get('/api/dossiers/:dossierId/sous-dossiers', authentifierToken, async (req, res) => {
    try {
        const { dossierId } = req.params;
        const service_dossier = new ServiceDossier();
        const sousDossiers = await service_dossier.recupererSousDossiers(dossierId);
        res.json(sousDossiers);
    } catch (error) {
        console.error('Erreur lors de la récupération des sous-dossiers :', error);
        res.status(500).json({ error: error.message || 'Erreur lors de la récupération' });
    }
});

// READ - Récupérer les fichiers d'un dossier
dossierRouter.get('/api/dossiers/:dossierId/fichiers', authentifierToken, async (req, res) => {
    try {
        const { dossierId } = req.params;
        const service_dossier = new ServiceDossier();
        const fichiers = await service_dossier.recupererFichiersDossier(dossierId);
        res.json(fichiers);
    } catch (error) {
        console.error('Erreur lors de la récupération des fichiers :', error);
        res.status(500).json({ error: error.message || 'Erreur lors de la récupération' });
    }
});

// DELETE - Supprimer un fichier du dossier
// (Suppression physique du fichier)
dossierRouter.delete('/api/dossiers/:dossierId/fichiers/:fileName', authentifierToken, async (req, res) => {
    try {
        const { dossierId, fileName } = req.params;
        const idUtilisateurAuthentifie = +req.utilisateur.id;

        const service_dossier = new ServiceDossier();
        const dossier = await service_dossier.recupererDossierParId(dossierId);
        if (dossier.idCompteCreateur !== idUtilisateurAuthentifie) {
            return res.status(403).json({ error: 'Ce dossier ne vous appartient pas' });
        }

        const resultat = await service_dossier.supprimerFichier(dossierId, decodeURIComponent(fileName));
        res.json(resultat);
    } catch (error) {
        console.error('Erreur lors de la suppression du fichier :', error);
        res.status(500).json({ error: error.message || 'Erreur lors de la suppression du fichier' });
    }
});

// READ - Récupérer la taille d'un dossier (incluant sous-dossiers)
dossierRouter.get('/api/dossiers/:dossierId/taille', authentifierToken, async (req, res) => {
    try {
        const { dossierId } = req.params;
        const service_dossier = new ServiceDossier();
        const taille = await service_dossier.recupererTailleDossier(dossierId);
        res.json({ dossierId, taille });
    } catch (error) {
        console.error('Erreur lors de la récupération de la taille :', error);
        res.status(500).json({ error: error.message || 'Erreur lors de la récupération' });
    }
});

// UPDATE - Mettre à jour un dossier
dossierRouter.put('/api/dossiers/:dossierId', authentifierToken, async (req, res) => {
    try {
        const { dossierId } = req.params;
        const { cheminDaccesDossier } = req.body;
        const idUtilisateurAuthentifie = +req.utilisateur.id;

        if (!cheminDaccesDossier) {
            return res.status(400).json({ error: 'cheminDaccesDossier est requis' });
        }

        // Vérifier que le dossier appartient à l'utilisateur
        const service_dossier = new ServiceDossier();
        const dossier = await service_dossier.recupererDossierParId(dossierId);
        if (dossier.idCompteCreateur !== idUtilisateurAuthentifie) {
            return res.status(403).json({ error: 'Ce dossier ne vous appartient pas' });
        }

        // Vérifier qu'il n'existe pas déjà un dossier avec le même nom dans le même dossier parent
        let dossiersExistants = [];
        if (dossier.idDossierParent) {
            dossiersExistants = await service_dossier.recupererSousDossiers(dossier.idDossierParent);
        } else {
            dossiersExistants = await service_dossier.recupererDossierRacineParCompte(idUtilisateurAuthentifie);
        }
        const nomExisteDeja = dossiersExistants.some(
            d => d.cheminDaccesDossier.toLowerCase() === cheminDaccesDossier.trim().toLowerCase() && d.idDossier !== Number(dossierId)
        );
        if (nomExisteDeja) {
            return res.status(409).json({ error: 'Un dossier portant ce nom existe déjà à cet emplacement.' });
        }

        const resultat = await service_dossier.mettreAJourDossier(dossierId, cheminDaccesDossier.trim());
        res.json(resultat);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du dossier :', error);
        res.status(500).json({ error: error.message || 'Erreur lors de la mise à jour' });
    }
});

// DELETE - Supprimer un dossier
// (Suppression définitive)
dossierRouter.delete('/api/dossiers/:dossierId', authentifierToken, async (req, res) => {
    try {
        const { dossierId } = req.params;
        const idUtilisateurAuthentifie = +req.utilisateur.id;

        // Vérifier que le dossier appartient à l'utilisateur
        const service_dossier = new ServiceDossier();
        const dossier = await service_dossier.recupererDossierParId(dossierId);
        if (dossier.idCompteCreateur !== idUtilisateurAuthentifie) {
            return res.status(403).json({ error: 'Ce dossier ne vous appartient pas' });
        }

        const resultat = await service_dossier.supprimerDossier(dossierId);
        res.json(resultat);
    } catch (error) {
        console.error('Erreur lors de la suppression du dossier :', error);
        res.status(500).json({ error: error.message || 'Erreur lors de la suppression' });
    }
});

// ===== GESTION DES FICHIERS =====

// Récupérer / Voir le contenu d'un fichier
dossierRouter.get('/api/dossiers/:dossierId/fichiers/:nomFichier', authentifierToken, verifierDossierExiste, async (req, res) => {
    try {
        const { nomFichier } = req.params;
        const idUtilisateurAuthentifie = +req.utilisateur.id;

        // Vérifier que le dossier appartient à l'utilisateur
        if (req.idCompteCreateur !== idUtilisateurAuthentifie) {
            return res.status(403).json({ error: 'Ce dossier ne vous appartient pas' });
        }

        const cheminDossierPhysique = path.join(SERVER_FILES_PATH, `user_${req.idCompteCreateur}`, req.cheminDossier);
        const cheminFichierPhysique = path.join(cheminDossierPhysique, nomFichier);

        if (!fs.existsSync(cheminFichierPhysique)) {
            return res.status(404).json({ error: 'Fichier introuvable sur le serveur' });
        }

        // Express envoie le fichier et gère automatiquement le type et le streaming basique
        res.sendFile(cheminFichierPhysique);
    } catch (error) {
        console.error('Erreur lors de la récupération du fichier :', error);
        res.status(500).json({ error: 'Erreur lors de la lecture du fichier' });
    }
});

// Middleware pour intercepter les erreurs Multer et retourner un JSON lisible
const gererErreurMulter = (uploadMiddleware) => (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
        if (!err) return next();
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'Fichier trop volumineux. La taille maximale autorisée est de 50 Mo.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Trop de fichiers. Vous ne pouvez pas envoyer plus de 10 fichiers à la fois.' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ error: 'Champ de fichier inattendu.' });
        }
        return res.status(500).json({ error: err.message || 'Erreur lors du téléversement.' });
    });
};

// Téléversement d'un fichier dans un dossier
dossierRouter.post('/api/dossiers/:dossierId/televerser', authentifierToken, verifierDossierExiste, gererErreurMulter(upload.single('fichier')), async (req, res) => {
    try {
        const { dossierId } = req.params;
        const idUtilisateurAuthentifie = +req.utilisateur.id;
        
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }

        // Vérifier que l'utilisateur authentifié est le propriétaire du dossier
        if (req.idCompteCreateur !== idUtilisateurAuthentifie) {
            // Supprimer le fichier uploadé puisqu'on n'en a pas besoin
            await fsPromises.unlink(req.file.path).catch(() => {});
            return res.status(403).json({ error: 'Ce dossier ne vous appartient pas' });
        }

        const service_dossier = new ServiceDossier();
        // Vérification fichiers ayant le même nom dans le même dossier
        const fichiersExistants = await service_dossier.recupererFichiersDossier(dossierId);
        const nomExiste = fichiersExistants.some(f => f.nom.toLowerCase() === req.file.originalname.toLowerCase());

        if (nomExiste) {
            // S'il y a un conflit, on supprime le fichier temporaire de Multer
            await fsPromises.unlink(req.file.path).catch(() => {});
            return res.status(409).json({ error: `Le fichier "${req.file.originalname}" existe déjà dans ce dossier.` });
        }

        // Déplacer le fichier vers le dossier correct
        // Structure: user_{idCompte}/chemin-du-dossier
        const cheminDossierPhysique = path.join(SERVER_FILES_PATH, `user_${req.idCompteCreateur}`, req.cheminDossier);
        
        // Créer le dossier de destination s'il n'existe pas
        if (!fs.existsSync(cheminDossierPhysique)) {
            fs.mkdirSync(cheminDossierPhysique, { recursive: true });
        }
        
        const ancienChemin = req.file.path;
        const nouveauChemin = path.join(cheminDossierPhysique, req.file.filename);
        
        fs.renameSync(ancienChemin, nouveauChemin);
        
        // Mettre à jour le chemin du fichier dans l'objet req.file
        req.file.path = nouveauChemin;

        const resultat = await service_dossier.televerserFichier(dossierId, req.file);
        res.status(201).json(resultat);
    } catch (error) {
        console.error('Erreur lors du téléversement :', error);
        res.status(500).json({ error: error.message || 'Erreur lors du téléversement' });
    }
});

// Téléversement de plusieurs fichiers
dossierRouter.post('/api/dossiers/:dossierId/televerser-multiple', authentifierToken, verifierDossierExiste, gererErreurMulter(upload.array('fichiers', 10)), async (req, res) => {
    try {
        const { dossierId } = req.params;
        const idUtilisateurAuthentifie = +req.utilisateur.id;
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }

        // Vérifier que l'utilisateur authentifié est le propriétaire du dossier
        if (req.idCompteCreateur !== idUtilisateurAuthentifie) {
            // Supprimer les fichiers uploadés
            await Promise.all(req.files.map(f => fsPromises.unlink(f.path).catch(() => {})));
            return res.status(403).json({ error: 'Ce dossier ne vous appartient pas' });
        }

        const service_dossier = new ServiceDossier();
        // Vérification fichiers ayant le même nom dans le même dossier
        const fichiersExistants = await service_dossier.recupererFichiersDossier(dossierId);
        const nomsFichiersExistants = new Set(fichiersExistants.map(f => f.nom.toLowerCase()));
        
        const fichiersEnConflit = req.files.filter(f => nomsFichiersExistants.has(f.originalname.toLowerCase()));

        if (fichiersEnConflit.length > 0) {
            // S'il y a conflit, on supprime les fichiers temporaires uploadés par Multer
            await Promise.all(req.files.map(f => fsPromises.unlink(f.path).catch(() => {})));
            const nomsConflits = fichiersEnConflit.map(f => f.originalname).join(', ');
            return res.status(409).json({ error: `Ce(s) fichier(s) existe(nt) déjà dans ce dossier : ${nomsConflits}` });
        }

        // Déplacer les fichiers vers le dossier correct
        // Structure: user_{idCompte}/chemin-du-dossier
        const cheminDossierPhysique = path.join(SERVER_FILES_PATH, `user_${req.idCompteCreateur}`, req.cheminDossier);
        
        // Créer le dossier de destination s'il n'existe pas
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
            fichiersDeplaces.map(file => service_dossier.televerserFichier(dossierId, file))
        );
        res.status(201).json({ message: 'Fichiers téléversés avec succès', files: resultats });
    } catch (error) {
        console.error('Erreur lors du téléversement multiple :', error);
        res.status(500).json({ error: error.message || 'Erreur lors du téléversement' });
    }
});

// Télécharger un dossier et son contenu en tant qu'archive ZIP
const parserListeChemins = (valeur) => {
    if (!valeur) return [];

    if (Array.isArray(valeur)) {
        return valeur.filter(v => typeof v === 'string');
    }

    if (typeof valeur === 'string') {
        try {
            const parse = JSON.parse(valeur);
            if (Array.isArray(parse)) {
                return parse.filter(v => typeof v === 'string');
            }
        } catch {
            return [valeur];
        }
    }

    return [];
};

const normaliserCheminRelatif = (cheminRelatif) => {
    if (typeof cheminRelatif !== 'string') return null;

    const cheminNettoye = cheminRelatif.trim();
    if (!cheminNettoye) return null;

    const normalise = path.normalize(cheminNettoye).replace(/^([/\\])+/, '');
    if (!normalise || normalise === '.') return null;

    return normalise;
};

const resoudreCheminSecurise = (baseUtilisateur, cheminRelatif) => {
    const relatif = normaliserCheminRelatif(cheminRelatif);
    if (!relatif) return null;

    const baseResolue = path.resolve(baseUtilisateur);
    const absolu = path.resolve(baseResolue, relatif);

    if (absolu !== baseResolue && !absolu.startsWith(`${baseResolue}${path.sep}`)) {
        return null;
    }

    return { absolu, relatif };
};

const construireNomArchiveUtilisateur = (utilisateur, idUtilisateur) => {
    const depuisNom = typeof utilisateur?.nom === 'string' ? utilisateur.nom : '';
    const depuisEmail = typeof utilisateur?.email === 'string'
        ? utilisateur.email.split('@')[0]
        : '';

    const brut = (depuisNom || depuisEmail || `user_${idUtilisateur}`).trim();

    const ascii = brut
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Za-z0-9._-]+/g, '_')
        .replace(/^[_\-.]+|[_\-.]+$/g, '');

    return ascii || `user_${idUtilisateur}`;
};

const genererNomUniqueZip = (nomSouhaite, nomsUtilises) => {
    const nomNettoye = (nomSouhaite || '').replace(/\\/g, '/').replace(/^[/]+|[/]+$/g, '');
    if (!nomNettoye) return null;

    const cleInitiale = nomNettoye.toLowerCase();
    if (!nomsUtilises.has(cleInitiale)) {
        nomsUtilises.add(cleInitiale);
        return nomNettoye;
    }

    const extension = path.extname(nomNettoye);
    const base = extension ? nomNettoye.slice(0, -extension.length) : nomNettoye;

    let compteur = 2;
    while (true) {
        const candidat = `${base} (${compteur})${extension}`;
        const cle = candidat.toLowerCase();
        if (!nomsUtilises.has(cle)) {
            nomsUtilises.add(cle);
            return candidat;
        }

        compteur += 1;
    }
};

dossierRouter.get('/api/telechargerZip', authentifierToken, async (req, res) => {
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
        console.error('Erreur lors du téléchargement du dossier :', error);
        res.status(500).json({ error: error.message || 'Erreur lors du téléchargement' });
    }
});


// ===== GESTION DE LA CORBEILLE =====

// READ - Récupérer les dossiers de la corbeille
dossierRouter.get('/api/corbeille', authentifierToken, async (req, res) => {
    try {
        const idUtilisateurAuthentifie = +req.utilisateur.id;
        const service_dossier = new ServiceDossier();
        
        const dossiersCorbeille = await service_dossier.recupererDossiersCorbeille(idUtilisateurAuthentifie);
        res.json(dossiersCorbeille);
    } catch (error) {
        console.error('Erreur lors de la récupération de la corbeille :', error);
        res.status(500).json({ error: error.message || 'Erreur lors de la récupération' });
    }
});

// DELETE - Déplacer un dossier à la corbeille
dossierRouter.delete('/api/dossiers/:dossierId/vers-corbeille', authentifierToken, async (req, res) => {
    try {
        const { dossierId } = req.params;
        const idUtilisateurAuthentifie = +req.utilisateur.id;

        // Vérifier que le dossier appartient à l'utilisateur
        const service_dossier = new ServiceDossier();
        const dossier = await service_dossier.recupererDossierParId(dossierId);
        
        if (dossier.idCompteCreateur !== idUtilisateurAuthentifie) {
            return res.status(403).json({ error: 'Ce dossier ne vous appartient pas' });
        }

        // Ne pas permettre de supprimer la corbeille elle-même
        if (dossier.cheminDaccesDossier === '.corbeille') {
            return res.status(400).json({ error: 'Impossible de supprimer la corbeille' });
        }

        const resultat = await service_dossier.deplacerVersCorbeille(dossierId, idUtilisateurAuthentifie);
        res.json({ message: 'Dossier déplacé à la corbeille', dossier: resultat });
    } catch (error) {
        console.error('Erreur lors du déplacement vers la corbeille :', error);
        res.status(500).json({ error: error.message || 'Erreur lors du déplacement' });
    }
});

// DELETE - Déplacer un fichier vers la corbeille
// (origine : /api/dossiers/:dossierId/fichiers/:nomFichier/vers-corbeille)
dossierRouter.delete('/api/dossiers/:dossierId/fichiers/:nomFichier/vers-corbeille', authentifierToken, async (req, res) => {
    try {
        const { dossierId, nomFichier } = req.params;
        const idUtilisateurAuthentifie = +req.utilisateur.id;

        const service_dossier = new ServiceDossier();
        const dossier = await service_dossier.recupererDossierParId(dossierId);
        if (dossier.idCompteCreateur !== idUtilisateurAuthentifie) {
            return res.status(403).json({ error: 'Ce dossier ne vous appartient pas' });
        }

        const resultat = await service_dossier.deplacerFichierVersCorbeille(dossierId, decodeURIComponent(nomFichier));
        res.json({ message: 'Fichier déplacé à la corbeille', fichier: resultat });
    } catch (error) {
        console.error('Erreur lors du déplacement du fichier vers la corbeille :', error);
        res.status(500).json({ error: error.message || 'Erreur lors du déplacement du fichier vers la corbeille' });
    }
});

// POST - Restaurer un dossier depuis la corbeille
dossierRouter.post('/api/dossiers/:dossierId/restaurer', authentifierToken, async (req, res) => {
    try {
        const { dossierId } = req.params;
        const idUtilisateurAuthentifie = +req.utilisateur.id;

        // Vérifier que le dossier appartient à l'utilisateur
        const service_dossier = new ServiceDossier();
        const dossier = await service_dossier.recupererDossierParId(dossierId);
        
        if (dossier.idCompteCreateur !== idUtilisateurAuthentifie) {
            return res.status(403).json({ error: 'Ce dossier ne vous appartient pas' });
        }

        // Vérifier que le dossier est dans la corbeille
        const corbeille = await service_dossier.recupererCorbeille(idUtilisateurAuthentifie);
        if (dossier.idDossierParent !== corbeille.idDossier) {
            return res.status(400).json({ error: 'Ce dossier n\'est pas dans la corbeille' });
        }

        const resultat = await service_dossier.restaurerDossier(dossierId);
        res.json({ message: 'Dossier restauré avec succès', dossier: resultat });
    } catch (error) {
        console.error('Erreur lors de la restauration du dossier :', error);
        res.status(500).json({ error: error.message || 'Erreur lors de la restauration' });
    }
});

// POST - Restaurer un fichier depuis la corbeille
dossierRouter.post('/api/corbeille/fichiers/:nomFichier/restaurer', authentifierToken, async (req, res) => {
    try {
        const { nomFichier } = req.params;
        const idUtilisateurAuthentifie = +req.utilisateur.id;

        const service_dossier = new ServiceDossier();
        const resultat = await service_dossier.restaurerFichierDepuisCorbeille(idUtilisateurAuthentifie, decodeURIComponent(nomFichier));
        res.json({ message: 'Fichier restauré avec succès', fichier: resultat });
    } catch (error) {
        console.error('Erreur lors de la restauration du fichier :', error);
        res.status(500).json({ error: error.message || 'Erreur lors de la restauration du fichier' });
    }
});

// DELETE - Vider complètement la corbeille
dossierRouter.delete('/api/corbeille/vider', authentifierToken, async (req, res) => {
    try {
        const idUtilisateurAuthentifie = +req.utilisateur.id;
        const service_dossier = new ServiceDossier();
        
        const resultat = await service_dossier.viderCorbeille(idUtilisateurAuthentifie);
        res.json({ message: 'Corbeille vidée avec succès', dossiersSupprimes: resultat });
    } catch (error) {
        console.error('Erreur lors du vidage de la corbeille :', error);
        res.status(500).json({ error: error.message || 'Erreur lors du vidage' });
    }
});

export default dossierRouter;