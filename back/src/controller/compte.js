import express from 'express';
import ServiceCompte from '../metier/compte.js';

const compteRouter = express.Router();

compteRouter.post('/api/users', (req, res) => {
    const service_compte = new ServiceCompte();
    const nouveau_compte = req.body;
    const resultat = service_compte.creerCompte(nouveau_compte);
    res.status(201).json(resultat);
});

compteRouter.get('/api/users', async (req, res) => {
    const service_compte = new ServiceCompte();
    const comptes = await service_compte.recupererComptes();
    res.status(200).json(comptes);
});

export default compteRouter;