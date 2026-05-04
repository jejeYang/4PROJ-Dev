import express from 'express';
import DossierController from '../controllers/dossier.controller.js';
import { authentifierToken } from '../middlewares/auth.middleware.js';
import { upload, verifierDossierExiste } from '../middlewares/upload.middleware.js';

const router = express.Router();

// ===== CRUD DOSSIERS =====
router.post('/dossiers', authentifierToken, DossierController.createDossier);
router.get('/dossiers', authentifierToken, DossierController.getDossiers);
router.get('/dossiers/:dossierId', authentifierToken, DossierController.getDossierById);
router.get('/comptes/:idCompteCreateurDossier/dossiers', authentifierToken, DossierController.getDossiersByCompte);
router.get('/dossiers/:dossierId/sous-dossiers', authentifierToken, DossierController.getSousDossiers);
router.get('/dossiers/:dossierId/fichiers', authentifierToken, DossierController.getFichiersDossier);
router.delete('/dossiers/:dossierId/fichiers/:fileName', authentifierToken, DossierController.deleteFichier);
router.get('/dossiers/:dossierId/taille', authentifierToken, DossierController.getTailleDossier);
router.put('/dossiers/:dossierId', authentifierToken, DossierController.updateDossier);
router.delete('/dossiers/:dossierId', authentifierToken, DossierController.deleteDossier);

// ===== GESTION DES FICHIERS =====
router.get('/dossiers/:dossierId/fichiers/:nomFichier', authentifierToken, verifierDossierExiste, DossierController.getFichier);
router.post('/dossiers/:dossierId/televerser', authentifierToken, verifierDossierExiste, upload.single('fichier'), DossierController.televerserFichier);
router.post('/dossiers/:dossierId/televerser-multiple', authentifierToken, verifierDossierExiste, upload.array('fichiers', 10), DossierController.televerserMultipleFichiers);
router.get('/telechargerZip', authentifierToken, DossierController.telechargerZip);

// ===== GESTION DE LA CORBEILLE =====
router.get('/corbeille', authentifierToken, DossierController.getCorbeille);
router.delete('/dossiers/:dossierId/vers-corbeille', authentifierToken, DossierController.deplacerVersCorbeille);
router.delete('/dossiers/:dossierId/fichiers/:nomFichier/vers-corbeille', authentifierToken, DossierController.deplacerFichierVersCorbeille);
router.post('/dossiers/:dossierId/restaurer', authentifierToken, DossierController.restaurerDossier);
router.post('/corbeille/fichiers/:nomFichier/restaurer', authentifierToken, DossierController.restaurerFichier);
router.delete('/corbeille/vider', authentifierToken, DossierController.viderCorbeille);

export default router;
