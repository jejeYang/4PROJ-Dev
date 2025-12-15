// Import de la variable de configuration
import { PG_CONFIG } from '../global_properties.js';
import pgPromise from 'pg-promise';

const pgp = pgPromise(/* initialization options */);
const db = pgp(PG_CONFIG);

// La classe DTO pour le dossier
class DtoDossier {
    constructor(idDossier, idCompteCreateurDossier, cheminDaccesDossier) {
        this.idDossier = idDossier;
        this.idCompteCreateurDossier = idCompteCreateurDossier;
        this.cheminDaccesDossier = cheminDaccesDossier;
    }

    async creerDossier(dossier) {
        try {
            const req = `
                INSERT INTO public.dossier (idCompteCreateurDossier, cheminDaccesDossier) 
                VALUES ($1, $2) RETURNING *`;
            return await db.one(req, [dossier.idCompteCreateurDossier, dossier.cheminDaccesDossier]);
        } catch (error) {
            console.error('Erreur lors de la création du dossier :', error);
            throw error;
        }
    }

    async recupererDossierCompte(dossier) {
        try {
            const req = 'SELECT * FROM public.dossier WHERE idCompteCreateurDossier = $1';
            return await db.manyOrNone(req, [dossier.idCompteCreateurDossier]);
        } catch (error) {
            console.error('Erreur lors de la récupération des dossiers de l’utilisateur :', error);
            throw error;
        }
    }

    async recupererDossiers() {
        try {
            const req = 'SELECT * FROM public.dossier';
            return await db.manyOrNone(req);
        } catch (error) {
            console.error('Erreur lors de la récupération de tous les dossiers :', error);
            throw error;
        }
    }
}

export default DtoDossier;