import { db } from '../db.js';
//Import de la variable de configuration
import { PG_CONFIG } from '../global_properties.js';

// La class DTO pour le compte

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
    // Simuler la récupération des liens d'un utilisateur dans une base de données
    const req = 'SELECT * FROM public.liengenere where idCompte=' + lien.idCompte;
    return db.manyOrNone(req)
        .then(result => {
            return result;
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des liens de l utilisateur :', error);
            throw error;
        });
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