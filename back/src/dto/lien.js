import { PG_CONFIG } from '../global_properties.js';
import pgPromise from 'pg-promise';

const pgp = pgPromise(/* initialization options */);
const db = pgp(PG_CONFIG);

class DtoLienGenere {
    constructor(idCompte, cheminDaccesLienGenere, idLienGenere) {
        this.idCompte = idCompte;
        this.cheminDaccesLienGenere = cheminDaccesLienGenere;
        this.idLienGenere = idLienGenere;
    }

    async creerLien(lien) {
        try {
            const req = `
                INSERT INTO public.liengenere (idCompte, cheminDaccesLienGenere) 
                VALUES ($1, $2) RETURNING *`;
            return await db.one(req, [lien.idCompte, lien.cheminDaccesLienGenere]);
        } catch (error) {
            console.error('Erreur lors de la création du lien :', error);
            throw error;
        }
    }

    async recupererLiensCompte(lien) {
        try {
            const req = 'SELECT * FROM public.liengenere WHERE idCompte = $1';
            return await db.manyOrNone(req, [lien.idCompte]);
        } catch (error) {
            console.error('Erreur lors de la récupération des liens de l’utilisateur :', error);
            throw error;
        }
    }

    async recupererLiens() {
        try {
            const req = 'SELECT * FROM public.liengenere';
            return await db.manyOrNone(req);
        } catch (error) {
            console.error('Erreur lors de la récupération de tous les liens :', error);
            throw error;
        }
    }
}

export default DtoLienGenere;