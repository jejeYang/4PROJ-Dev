import DtoCompte from "../dto/compte.js";
import jwt from 'jsonwebtoken';

class ServiceCompte {
    constructor() {
        this.dto_compte = new DtoCompte();
        this.jwtSecret = 'your-secret-key'; // À changer en production
    }

    creerCompte(compte) {
        if (!compte.nom || compte.nom.trim() === '') {
            throw new Error('Le nom d\'utilisateur est requis');
        }
        if (!compte.email || compte.email.trim() === '') {
            throw new Error('L\'email est requis');
        }
        if (!compte.mdp || compte.mdp.trim() === '') {
            throw new Error('Le mot de passe est requis');
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(compte.email)) {
            throw new Error('Format d\'email invalide');
        }
        
        if (compte.mdp.length < 8) {
            throw new Error('Le mot de passe doit contenir au moins 8 caractères');
        }
        
        if (compte.nom.length < 5) {
            throw new Error('Le nom d\'utilisateur doit contenir au moins 5 caractères');
        }
        if (compte.nom.length < 5) {
            throw new Error("Le nom doit contenir au moins 5 caractères");
        }

        if (!/[A-Z]/.test(compte.nom)) {
            throw new Error("Le nom doit contenir au moins une majuscule");
        }

        if (!/[^a-zA-Z0-9]/.test(compte.nom)) {
            throw new Error("Le nom doit contenir au moins un caractère spécial");
        }
        if (!/[A-Z]/.test(compte.mdp)) {
            throw new Error("Le mot de passe doit contenir au moins une majuscule");
        }

        if (!/[^a-zA-Z0-9]/.test(compte.mdp)) {
            throw new Error("Le mot de passe doit contenir au moins un caractère spécial");
        }
        

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