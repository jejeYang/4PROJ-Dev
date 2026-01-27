import express from 'express';
import ServiceCompte from '../metier/compte.js';
import { authentifierToken } from '../middleware/auth.js';

const compteRouter = express.Router();

// Route de connexion (non protégée)
compteRouter.post('/api/login', async (req, res) => {
    try {
        const { email, mdp } = req.body;
        const service_compte = new ServiceCompte();
        const resultat = await service_compte.authentifierUtilisateur(email, mdp);
        
        if (resultat) {
            res.status(200).json({
                message: 'Connexion réussie',
                utilisateur: resultat.utilisateur,
                token: resultat.token
            });
        } else {
            res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Routes protégées
compteRouter.post('/api/users', authentifierToken, async (req, res) => {
    try {
        const service_compte = new ServiceCompte();
        const nouveau_compte = req.body;
        const resultat = await service_compte.creerCompte(nouveau_compte);
        res.status(201).json(resultat);
    } catch (error) {
        console.error('Erreur lors de la création du compte :', error);
        res.status(500).json({ error: error.message || 'Erreur lors de la création' });
    }
});

compteRouter.get('/api/users', authentifierToken, async (req, res) => {
    const service_compte = new ServiceCompte();
    const comptes = await service_compte.recupererComptes();
    res.status(200).json(comptes);
});

export default compteRouter;