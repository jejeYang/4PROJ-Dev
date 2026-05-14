import CompteService from '../services/compte.service.js';

class CompteController {
    constructor() {
        this.compteService = new CompteService();
    }

    login = async (req, res, next) => {
        try {
            const { email, mdp } = req.body;
            const resultat = await this.compteService.authentifierUtilisateur(email, mdp);
            
            // Sécurité : On vérifie si les identifiants sont bons
            if (!resultat) {
                return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
            }

            const utilisateur = resultat.utilisateur;
            const idUtilisateur = utilisateur.id || utilisateur.idCompte || utilisateur.idUtilisateur;

            // Si l'utilisateur n'a pas déjà une URL d'avatar valide (ex: un lien Google), on lui assigne la route locale
            if (!utilisateur.avatarUrl || !utilisateur.avatarUrl.startsWith('http')) {
                utilisateur.avatarUrl = `http://localhost:3000/api/users/avatar/${idUtilisateur}?t=${Date.now()}`;
            }
            delete utilisateur.avatarBlobCompte; // Nettoyage du blob pour alléger la réponse

            res.status(200).json({
                message: 'Connexion réussie',
                utilisateur: utilisateur,
                token: resultat.token
            });
        } catch (error) {
            next(error);
        }
    };

    loginGoogle = async (req, res, next) => {
        try {
            const { idToken } = req.body;
            if (!idToken) {
                return res.status(400).json({ message: 'idToken requis' });
            }

            const resultat = await this.compteService.authentifierGoogle(idToken);
            
            // On vérifie si le token Google a bien été validé
            if (!resultat) {
                return res.status(401).json({ message: 'Échec de l\'authentification Google' });
            }

            const utilisateur = resultat.utilisateur;
            const idUtilisateur = utilisateur.id || utilisateur.idCompte || utilisateur.idUtilisateur;

            // Même logique que le login classique : on préserve l'image Google si elle existe
            if (!utilisateur.avatarUrl || !utilisateur.avatarUrl.startsWith('http')) {
                utilisateur.avatarUrl = `http://localhost:3000/api/users/avatar/${idUtilisateur}?t=${Date.now()}`;
            }
            delete utilisateur.avatarBlobCompte;

            res.status(200).json({
                message: 'Connexion Google réussie',
                utilisateur: utilisateur,
                token: resultat.token,
            });
        } catch (error) {
            next(error);
        }
    };

    register = async (req, res, next) => {
        try {
            const nouveau_compte = req.body;
            const resultat = await this.compteService.creerCompte(nouveau_compte);
            res.status(201).json({ message: 'Compte créé avec succès', utilisateur: resultat });
        } catch (error) {
            next(error);
        }
    };

    getUsers = async (req, res, next) => {
        try {
            const comptes = await this.compteService.recupererComptes();
            res.status(200).json(comptes);
        } catch (error) {
            next(error);
        }
    };

    checkEmail = async (req, res, next) => {
        try {
            const { email } = req.query;
            if (!email) {
                return res.status(400).json({ message: 'Email requis pour la vérification.' });
            }

            const compte = await this.compteService.trouverParEmail(email);
            res.status(200).json({ exists: Boolean(compte) });
        } catch (error) {
            next(error);
        }
    };

    updateUser = async (req, res, next) => {
        try {
            const { id } = req.params;
            const idUtilisateurAuthentifie = +req.utilisateur.id;

            if (Number.parseInt(id, 10) !== idUtilisateurAuthentifie) {
                return res.status(403).json({ message: 'Vous ne pouvez modifier que votre propre profil' });
            }

            const { nom, email } = req.body;
            
            if (!nom && !email) {
                return res.status(400).json({ message: 'Au moins un champ (nom ou email) doit être fourni' });
            }

            const donnees = {};
            if (nom) donnees.nom = nom;
            if (email) donnees.email = email;

            const resultat = await this.compteService.mettreAJourCompte(id, donnees);
            res.status(200).json({ message: 'Profil mis à jour avec succès', utilisateur: resultat });
        } catch (error) {
            next(error);
        }
    };

    uploadAvatar = async (req, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'Aucun fichier envoyé' });
            }

            const idUtilisateurAuthentifie = +req.utilisateur.id;
            await this.compteService.mettreAJourAvatar(idUtilisateurAuthentifie, req.file.buffer);
            
            res.status(200).json({ message: 'Avatar mis à jour avec succès' });
        } catch (error) {
            next(error);
        }
    };

    getAvatar = async (req, res, next) => {
        try {
            const { id } = req.params;
            const resultat = await this.compteService.recupererAvatar(id);

            if (!resultat || !resultat.avatarBlobCompte) {
                return res.status(404).json({ message: 'Avatar non trouvé' });
            }

            res.set('Content-Type', 'image/png');
            res.send(resultat.avatarBlobCompte);
        } catch (error) {
            next(error);
        }
    };

    changePassword = async (req, res, next) => {
        try {
            const { ancienMdp, nouveauMdp, confirmationMdp } = req.body;
            const idUtilisateurAuthentifie = +req.utilisateur.id;

            if (!ancienMdp || !nouveauMdp || !confirmationMdp) {
                return res.status(400).json({ message: 'Tous les champs sont requis' });
            }

            if (nouveauMdp !== confirmationMdp) {
                return res.status(400).json({ message: 'Les nouveaux mots de passe ne correspondent pas' });
            }

            const resultat = await this.compteService.changerMotDePasse(idUtilisateurAuthentifie, ancienMdp, nouveauMdp);
            res.status(200).json({ message: 'Mot de passe changé avec succès', utilisateur: resultat });
        } catch (error) {
            next(error);
        }
    };

    deleteUser = async (req, res, next) => {
        try {
            const idUtilisateurAuthentifie = +req.utilisateur.id;
            const emailUtilisateur = req.utilisateur.email;
            const { mot_de_passe } = req.body;

            if (!mot_de_passe) {
                return res.status(400).json({ message: 'Le mot de passe est requis pour confirmer la suppression' });
            }

            const estValide = await this.compteService.authentifierUtilisateur(emailUtilisateur, mot_de_passe);
            
            if (!estValide) {
                return res.status(401).json({ message: 'Le mot de passe est incorrect' });
            }

            await this.compteService.supprimerCompte(idUtilisateurAuthentifie);
            res.status(200).json({ message: 'Compte supprimé avec succès' });
        } catch (error) {
            next(error);
        }
    };
}

export default new CompteController();