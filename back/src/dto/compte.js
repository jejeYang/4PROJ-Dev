// Import de la variable de configuration
import { PG_CONFIG, SERVER_FILES_PATH } from '../global_properties.js';
import pgPromise from 'pg-promise';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';

const pgp = pgPromise(/* initialization options */);
const db = pgp(PG_CONFIG);

// La classe DTO pour le compte
class DtoCompte {
    constructor(id, nom, email, mdp, stockage, avatar) {
        this.id = id;
        this.nom = nom;
        this.email = email;
        this.mdp = mdp;
        this.stockage = stockage;
        this.avatar = avatar;
    }

    async creerCompte(compte) {
        try {
            const emailExiste = await this.trouverParEmail(compte.email);
            if (emailExiste) {
                throw new Error('Cet email est déjà utilisé');
            }
            
            const hashedPassword = await bcrypt.hash(compte.mdp, 10);
            const req = `
                INSERT INTO public.compte (nomcompte, adressemailcompte, mdpcompte, stockagecompte) 
                VALUES ($1, $2, $3, $4) RETURNING *`;
            const resultat = await db.one(req, [compte.nom, compte.email, hashedPassword, compte.stockage || 0]);
            
            // Créer le dossier racine pour l'utilisateur
            const cheminDossierUtilisateur = path.join(SERVER_FILES_PATH, `user_${resultat.idcompte}`);
            if (!fs.existsSync(cheminDossierUtilisateur)) {
                fs.mkdirSync(cheminDossierUtilisateur, { recursive: true });
            }
            
            return resultat;
        } catch (error) {
            console.error('Erreur lors de la création du compte :', error);
            throw error;
        }
    }

    async recupererComptes() {
        try {
            const req = 'SELECT idcompte, nomcompte, adressemailcompte, stockagecompte FROM public.compte';
            return await db.manyOrNone(req);
        } catch (error) {
            console.error('Erreur lors de la récupération des comptes :', error);
            throw error;
        }
    }

    async trouverParEmail(email) {
        try {
            const req = 'SELECT * FROM public.compte WHERE adressemailcompte = $1';
            return await db.oneOrNone(req, [email]);
        } catch (error) {
            console.error('Erreur lors de la recherche du compte :', error);
            throw error;
        }
    }

    async verifierMotDePasse(email, mdp) {
        try {
            const compte = await this.trouverParEmail(email);
            if (!compte) return null;
            
            const isValid = await bcrypt.compare(mdp, compte.mdpcompte);
            if (isValid) {
                return { id: compte.idcompte, nom: compte.nomcompte, email: compte.adressemailcompte };
            }
            return null;
        } catch (error) {
            console.error('Erreur lors de la vérification du mot de passe :', error);
            throw error;
        }
    }
}

export default DtoCompte;