import multer from 'multer';
import { SERVER_FILES_PATH } from '../config/env.js';
import DossierService from '../services/dossier.service.js';
import { construireCheminComplet } from '../utils/file.utils.js';

// Configuration de multer avec destination dynamique
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, SERVER_FILES_PATH);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

export const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50 MB max
    }
});

// Configuration de multer pour stocker l'image en mémoire (Buffer) - pour l'avatar
const memoryStorage = multer.memoryStorage();
export const uploadAvatar = multer({
    storage: memoryStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Limite à 2Mo
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Seules les images sont autorisées'));
        }
    }
});

// Middleware de vérification du dossier avant téléversement
export const verifierDossierExiste = async (req, res, next) => {
    try {
        const { dossierId } = req.params;
        const service_dossier = new DossierService();
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
