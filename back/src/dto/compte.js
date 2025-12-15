// Import de la variable de configuration
import { PG_CONFIG } from '../global_properties.js';
import pgPromise from 'pg-promise';

const pgp = pgPromise(/* initialization options */);
const db = pgp(PG_CONFIG);

// La classe DTO pour le compte
class DtoCompte {
    constructor(id, nom, solde) {
        this.id = id;
        this.nom = nom;
        this.solde = solde;
    }

    async creerCompte(compte) {
        try {
            const req = `
                INSERT INTO public.compte (nom, solde) 
                VALUES ($1, $2) RETURNING *`;
            return await db.one(req, [compte.nom, compte.solde]);
        } catch (error) {
            console.error('Erreur lors de la création du compte :', error);
            throw error;
        }
    }

    async recupererComptes() {
        try {
            const req = 'SELECT * FROM public.compte';
            return await db.manyOrNone(req);
        } catch (error) {
            console.error('Erreur lors de la récupération des comptes :', error);
            throw error;
        }
    }
}

export default DtoCompte;