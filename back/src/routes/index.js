import express from 'express';
import compteRoutes from './compte.routes.js';
import dossierRoutes from './dossier.routes.js';
import lienRoutes from './lien.routes.js';

const router = express.Router();

router.use('/api', compteRoutes);
router.use('/api', dossierRoutes);
router.use('/api', lienRoutes);

export default router;
