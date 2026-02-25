import DtoCompte from "../dto/compte.js";
import ServiceDossier from "./dossier.js";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../global_properties.js';

class ServiceCompte {
    constructor() {
        this.dto_compte = new DtoCompte();
        this.service_dossier = new ServiceDossier();
        this.jwtSecret = JWT_SECRET;
    }

    async creerCompte(compte) {
        // Créer le compte
        const utilisateur = await this.dto_compte.creerCompte(compte);
        
        // Créer automatiquement un dossier corbeille pour le nouvel utilisateur
        try {
            const dossierCorbeille = {
                idCompteCreateur: utilisateur.idcompte,
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

    async authentifierUtilisateur(email, mdp) {
        const utilisateur = await this.dto_compte.verifierMotDePasse(email, mdp);
        if (utilisateur) {
            const token = jwt.sign(
                { id: utilisateur.id, email: utilisateur.email },
                this.jwtSecret,
                { expiresIn: '24h' }
            );
            return { utilisateur, token };
        }
        return null;
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