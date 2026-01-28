import express from 'express';
import ServiceDossier from '../metier/dossier.js';
import { authentifierToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'node:path';
import fs, { promises as fsPromises } from 'node:fs';
import { SERVER_FILES_PATH } from '../global_properties.js';

const dossierRouter = express.Router();

// Configuration de multer avec destination dynamique
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // La destination sera déterminée dans le middleware
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
const verifierDossierExiste = async (req, res, next) => {
    try {
        const { dossierId } = req.params;
        const service_dossier = new ServiceDossier();
        const dossier = await service_dossier.recupererDossierParId(dossierId);
        // Stocker l'ID du dossier, l'ID du créateur et le chemin d'accès dans la requête
        req.dossierId = dossier.iddossier;
        req.idCompteCreateur = dossier.idcomptecreateur;
        req.cheminDossier = dossier.chemindaccesdossier;
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
        const { idCompteCreateur, cheminDaccesDossier, idDossierParent } = req.body;
        const idUtilisateurAuthentifie = req.utilisateur.id;

        if (!idCompteCreateur || !cheminDaccesDossier) {
            return res.status(400).json({ error: 'idCompteCreateur et cheminDaccesDossier sont requis' });
        }

        // Vérifier que l'utilisateur authentifié crée un dossier pour son propre compte
        if (idCompteCreateur !== idUtilisateurAuthentifie) {
            return res.status(403).json({ error: 'Vous ne pouvez créer un dossier que pour votre compte' });
        }

        // Si un dossier parent est spécifié, vérifier qu'il appartient aussi à l'utilisateur
        if (idDossierParent) {
            const service_dossier = new ServiceDossier();
            const dossierParent = await service_dossier.recupererDossierParId(idDossierParent);
            if (dossierParent.idcomptecreateur !== idUtilisateurAuthentifie) {
                return res.status(403).json({ error: 'Le dossier parent ne vous appartient pas' });
            }
        }

        const service_dossier = new ServiceDossier();
        const dossier = { idCompteCreateur, cheminDaccesDossier, idDossierParent };
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
        const dossiers = await service_dossier.recupererDossiersParCompte(idCompteCreateurDossier);
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

// UPDATE - Mettre à jour un dossier
dossierRouter.put('/api/dossiers/:dossierId', authentifierToken, async (req, res) => {
    try {
        const { dossierId } = req.params;
        const { cheminDaccesDossier } = req.body;
        const idUtilisateurAuthentifie = req.utilisateur.id;

        if (!cheminDaccesDossier) {
            return res.status(400).json({ error: 'cheminDaccesDossier est requis' });
        }

        // Vérifier que le dossier appartient à l'utilisateur
        const service_dossier = new ServiceDossier();
        const dossier = await service_dossier.recupererDossierParId(dossierId);
        if (dossier.idcomptecreateur !== idUtilisateurAuthentifie) {
            return res.status(403).json({ error: 'Ce dossier ne vous appartient pas' });
        }

        const resultat = await service_dossier.mettreAJourDossier(dossierId, cheminDaccesDossier);
        res.json(resultat);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du dossier :', error);
        res.status(500).json({ error: error.message || 'Erreur lors de la mise à jour' });
    }
});

// DELETE - Supprimer un dossier
dossierRouter.delete('/api/dossiers/:dossierId', authentifierToken, async (req, res) => {
    try {
        const { dossierId } = req.params;
        const idUtilisateurAuthentifie = req.utilisateur.id;

        // Vérifier que le dossier appartient à l'utilisateur
        const service_dossier = new ServiceDossier();
        const dossier = await service_dossier.recupererDossierParId(dossierId);
        if (dossier.idcomptecreateur !== idUtilisateurAuthentifie) {
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

// Téléversement d'un fichier dans un dossier
dossierRouter.post('/api/dossiers/:dossierId/televerser', authentifierToken, verifierDossierExiste, upload.single('fichier'), async (req, res) => {
    try {
        const { dossierId } = req.params;
        const idUtilisateurAuthentifie = req.utilisateur.id;
        
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }

        // Vérifier que l'utilisateur authentifié est le propriétaire du dossier
        if (req.idCompteCreateur !== idUtilisateurAuthentifie) {
            // Supprimer le fichier uploadé puisqu'on n'en a pas besoin
            await fsPromises.unlink(req.file.path).catch(() => {});
            return res.status(403).json({ error: 'Ce dossier ne vous appartient pas' });
        }

        // Déplacer le fichier vers le dossier correct
        // Structure: dossier_{idCompte}
        const cheminDossierPhysique = path.join(SERVER_FILES_PATH, req.cheminDossier);
        
        // Créer le dossier de destination s'il n'existe pas
        if (!fs.existsSync(cheminDossierPhysique)) {
            fs.mkdirSync(cheminDossierPhysique, { recursive: true });
        }
        
        const ancienChemin = req.file.path;
        const nouveauChemin = path.join(cheminDossierPhysique, req.file.filename);
        
        fs.renameSync(ancienChemin, nouveauChemin);
        
        // Mettre à jour le chemin du fichier dans l'objet req.file
        req.file.path = nouveauChemin;

        const service_dossier = new ServiceDossier();
        const resultat = await service_dossier.televerserFichier(dossierId, req.file);
        res.status(201).json(resultat);
    } catch (error) {
        console.error('Erreur lors du téléversement :', error);
        res.status(500).json({ error: error.message || 'Erreur lors du téléversement' });
    }
});

// Téléversement de plusieurs fichiers
dossierRouter.post('/api/dossiers/:dossierId/televerser-multiple', authentifierToken, verifierDossierExiste, upload.array('fichiers', 10), async (req, res) => {
    try {
        const { dossierId } = req.params;
        const idUtilisateurAuthentifie = req.utilisateur.id;
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }

        // Vérifier que l'utilisateur authentifié est le propriétaire du dossier
        if (req.idCompteCreateur !== idUtilisateurAuthentifie) {
            // Supprimer les fichiers uploadés
            await Promise.all(req.files.map(f => fsPromises.unlink(f.path).catch(() => {})));
            return res.status(403).json({ error: 'Ce dossier ne vous appartient pas' });
        }

        // Déplacer les fichiers vers le dossier correct
        // Structure: dossier_{idCompte}
        const cheminDossierPhysique = path.join(SERVER_FILES_PATH, req.cheminDossier);
        
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

        const service_dossier = new ServiceDossier();
        const resultats = await Promise.all(
            fichiersDeplaces.map(file => service_dossier.televerserFichier(dossierId, file))
        );
        res.status(201).json({ message: 'Fichiers téléversés avec succès', files: resultats });
    } catch (error) {
        console.error('Erreur lors du téléversement multiple :', error);
        res.status(500).json({ error: error.message || 'Erreur lors du téléversement' });
    }
});

export default dossierRouter;