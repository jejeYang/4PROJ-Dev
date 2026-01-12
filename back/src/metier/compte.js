import DtoCompte from "../dto/compte.js";
import jwt from 'jsonwebtoken';

class ServiceCompte {
    constructor() {
        this.dto_compte = new DtoCompte();
        this.jwtSecret = 'your-secret-key'; // À changer en production
    }

    creerCompte(compte) {
        return this.dto_compte.creerCompte(compte);
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
            return null;
        }
    }
}

export default ServiceCompte;