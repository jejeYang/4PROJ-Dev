import express from 'express';
import LienController from '../controllers/lien.controller.js';
import { authentifierToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ===== PARTAGE INTERNE (Utilisateurs) =====
router.post('/partage/utilisateur/:dossierId', authentifierToken, LienController.partagerVersUtilisateur);
router.get('/partage/envoyes', authentifierToken, LienController.getPartagesEnvoyes);
router.get('/partage/recus', authentifierToken, LienController.getPartagesRecus);
router.delete('/partage/interne/:dossierIdPartage', authentifierToken, LienController.supprimerPartageInterne);

// ===== PARTAGE PAR LIEN (Invités) =====
router.post('/partage/lien/:dossierId', authentifierToken, LienController.creerLienPublic);
router.get('/partage/mes-liens', authentifierToken, LienController.getMesLiensPublics);
router.delete('/partage/lien/:idLien', authentifierToken, LienController.supprimerLienPublic);

// Accès public (invité)
router.get('/liens/:token', LienController.accederLienPartage);
router.get('/liens/:token/details', LienController.obtenirDetailsLien);

export default router;