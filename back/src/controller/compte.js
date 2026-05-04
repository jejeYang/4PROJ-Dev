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

compteRouter.post('/api/auth/google', async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ message: 'idToken requis' });
        }

        const service_compte = new ServiceCompte();
        const resultat = await service_compte.authentifierGoogle(idToken);

        res.status(200).json({
            message: 'Connexion Google réussie',
            utilisateur: resultat.utilisateur,
            token: resultat.token,
        });
    } catch (error) {
        console.error('Erreur lors de la connexion Google:', error);
        res.status(401).json({ message: error.message || 'Échec de l\'authentification Google' });
    }
});

compteRouter.post('/api/register', async (req, res) => {
    try {
        const service_compte = new ServiceCompte();
        const nouveau_compte = req.body;
        const resultat = await service_compte.creerCompte(nouveau_compte);
        
        // Générer un token pour connecter automatiquement l'utilisateur
        const utilisateur = {
            id: resultat.idCompte,
            nom: resultat.nomCompte,
            email: resultat.adresseMailCompte
        };
        const token = service_compte.genererToken(utilisateur);
        
        res.status(201).json({ 
            message: 'Compte créé avec succès', 
            utilisateur,
            token 
        });
    } catch (error) {
        console.error('Erreur lors de la création du compte :', error);
        res.status(400).json({ message: error.message || 'Erreur lors de la création' });
    }
});

// Routes protégées

compteRouter.get('/api/users', authentifierToken, async (req, res) => {
    const service_compte = new ServiceCompte();
    const comptes = await service_compte.recupererComptes();
    res.status(200).json(comptes);
});
/******************************************************************* */
// GET - Récupérer le profil d'un utilisateur spécifique
compteRouter.get('/api/users/:id', authentifierToken, async (req, res) => {
    try {
        const { id } = req.params;
        const service_compte = new ServiceCompte();
        const utilisateur = await service_compte.recupererCompteParId(Number.parseInt(id, 10));
        
        if (!utilisateur) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.status(200).json(utilisateur);
    } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});
/******************************************************************* */
// PUT - Mettre à jour le profil utilisateur
compteRouter.put('/api/users/:id', authentifierToken, async (req, res) => {
    try {
        const { id } = req.params;
        const idUtilisateurAuthentifie = +req.utilisateur.id;

        // Vérifier que l'utilisateur modifie son propre profil
        if (Number.parseInt(id, 10) !== idUtilisateurAuthentifie) {
            return res.status(403).json({ message: 'Vous ne pouvez modifier que votre propre profil' });
        }

        const { nom, email } = req.body;

        // Vérifier qu'au moins un champ est fourni
        if (!nom && !email) {
            return res.status(400).json({ message: 'Au moins un champ doit être fourni' });
        }

        const service_compte = new ServiceCompte();
        const donnees = {};
        if (nom) donnees.nom = nom;
        if (email) donnees.email = email;

        const resultat = await service_compte.mettreAJourCompte(id, donnees);
        res.status(200).json({ message: 'Profil mis à jour avec succès', utilisateur: resultat });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil :', error);
        res.status(400).json({ message: error.message || 'Erreur lors de la mise à jour' });
    }
});

// POST - Changer le mot de passe
compteRouter.post('/api/change-password', authentifierToken, async (req, res) => {
    try {
        const { ancienMdp, nouveauMdp, confirmationMdp } = req.body;
        const idUtilisateurAuthentifie = +req.utilisateur.id;

        // Vérifier que tous les champs sont fournis
        if (!ancienMdp || !nouveauMdp || !confirmationMdp) {
            return res.status(400).json({ message: 'Tous les champs sont requis' });
        }

        // Vérifier que les nouveaux mots de passe correspondent
        if (nouveauMdp !== confirmationMdp) {
            return res.status(400).json({ message: 'Les nouveaux mots de passe ne correspondent pas' });
        }

        const service_compte = new ServiceCompte();
        const resultat = await service_compte.changerMotDePasse(idUtilisateurAuthentifie, ancienMdp, nouveauMdp);
        res.status(200).json({ message: 'Mot de passe changé avec succès', utilisateur: resultat });
    } catch (error) {
        console.error('Erreur lors du changement de mot de passe :', error);
        res.status(400).json({ message: error.message || 'Erreur lors du changement' });
    }
});

// DELETE - Supprimer le compte utilisateur
compteRouter.delete('/api/users', authentifierToken, async (req, res) => {
    try {
        const idUtilisateurAuthentifie = +req.utilisateur.id;
        const { mdp } = req.body;

        // Vérifier que le mot de passe est fourni
        if (!mdp) {
            return res.status(400).json({ message: 'Le mot de passe est requis pour confirmer la suppression' });
        }

        // Vérifier que le mot de passe est correct
        const service_compte = new ServiceCompte();
        const utilisateur = await service_compte.authentifierUtilisateur(req.utilisateur.email, mdp);
        if (!utilisateur) {
            return res.status(401).json({ message: 'Le mot de passe est incorrect' });
        }

        // Supprimer le compte (cela supprime aussi tous les dossiers et fichiers associés grâce aux cascades Prisma)
        await service_compte.supprimerCompte(idUtilisateurAuthentifie);
        res.status(200).json({ message: 'Compte supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du compte :', error);
        res.status(500).json({ message: error.message || 'Erreur lors de la suppression' });
    }
});

export default compteRouter;