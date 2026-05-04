import express from 'express';
import LienController from '../controllers/lien.controller.js';
import { authentifierToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/dossiers/:dossierId/partager', authentifierToken, LienController.genererLienPartage);
router.get('/liens/:token', LienController.accederLienPartage);
router.get('/liens/:token/details', LienController.obtenirDetailsLien);

export default router;
