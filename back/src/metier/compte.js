import DtoCompte from "../dto/compte.js";
import ServiceDossier from "./dossier.js";
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { GOOGLE_CLIENT_ID, JWT_SECRET } from '../global_properties.js';

class ServiceCompte {
    constructor() {
        this.dto_compte = new DtoCompte();
        this.service_dossier = new ServiceDossier();
        this.jwtSecret = JWT_SECRET;
        this.googleClientId = GOOGLE_CLIENT_ID;
        this.googleClient = this.googleClientId ? new OAuth2Client(this.googleClientId) : null;
    }

    genererToken(utilisateur) {
        return jwt.sign(
            { id: utilisateur.id, nom: utilisateur.nom, email: utilisateur.email },
            this.jwtSecret,
            { expiresIn: '24h' }
        );
    }

    async creerCompte(compte) {
        // Créer le compte
        const utilisateur = await this.dto_compte.creerCompte(compte);
        
        // Créer automatiquement un dossier corbeille pour le nouvel utilisateur
        try {
            const dossierCorbeille = {
                idCompteCreateur: utilisateur.idCompte,
                cheminDaccesDossier: `.corbeille`,
            };
            await this.service_dossier.creerDossier(dossierCorbeille);
        } catch (error) {
            console.error('Erreur lors de la création du dossier corbeille:', error);
        }
        
        return utilisateur;
    }

    async recupererComptes() {
        return await this.dto_compte.recupererComptes();
    }

/************************************************ */
    async recupererCompteParId(id) {
        return await this.dto_compte.recupererCompteParId(id);
    }
/************************************************ */
    async authentifierUtilisateur(email, mdp) {
        const utilisateur = await this.dto_compte.verifierMotDePasse(email, mdp);
        if (utilisateur) {
            const token = this.genererToken(utilisateur);
            return { utilisateur, token };
        }
        return null;
    }

    async authentifierGoogle(idToken) {
        if (!this.googleClient || !this.googleClientId) {
            throw new Error('Google Auth non configuré sur le serveur');
        }

        const ticket = await this.googleClient.verifyIdToken({
            idToken,
            audience: this.googleClientId,
        });

        const payload = ticket.getPayload();
        if (!payload?.email || !payload.email_verified) {
            throw new Error('Compte Google invalide');
        }

        let compte = await this.dto_compte.trouverParEmail(payload.email);
        if (!compte) {
            const motDePasseOAuth = `Aa1!${crypto.randomBytes(16).toString('hex')}`;
            const nouveauCompte = await this.creerCompte({
                nom: payload.name || payload.email.split('@')[0],
                email: payload.email,
                mdp: motDePasseOAuth,
            });

            compte = {
                idCompte: nouveauCompte.idCompte,
                nomCompte: nouveauCompte.nomCompte,
                adresseMailCompte: nouveauCompte.adresseMailCompte,
            };
        }

        const utilisateur = {
            id: compte.idCompte,
            nom: compte.nomCompte,
            email: compte.adresseMailCompte,
        };

        return { utilisateur, token: this.genererToken(utilisateur) };
    }

    async mettreAJourCompte(idCompte, donnees) {
        return await this.dto_compte.mettreAJourCompte(idCompte, donnees);
    }

    async changerMotDePasse(idCompte, ancienMdp, nouveauMdp) {
        return await this.dto_compte.changerMotDePasse(idCompte, ancienMdp, nouveauMdp);
    }

    async supprimerCompte(idCompte) {
        return await this.dto_compte.supprimerCompte(idCompte);
    }

    verifierToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            console.error('Token verification failed:', error);
            return null;
        }
    }
}

export default ServiceCompte;
