//Import de la variable de configuration
import { PG_CONFIG } from '../global_properties.js';
import pgPromise from 'pg-promise';

const pgp = pgPromise(/* initialization options */);
const db = pgp(PG_CONFIG);

// La class DTO pour le compte

class DtoCompte {
    constructor(id, nom, solde) {
        this.id = id;
        this.nom = nom;
        this.solde = solde;
    }

    creerCompte(compte) {
    // Simuler la sauvegarde du compte dans une base de données
    const req = `INSERT INTO public.compte (nom, solde) VALUES ('${compte.nom}', ${compte.solde}) RETURNING *`;
    let result = db.one(req);
    return result;
    }

    async recupererComptes() {
    const req = 'SELECT * FROM public.compte';
    return db.manyOrNone(req)
        .then(result => {
            return result;
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des comptes:', error);
            throw error;
        });
}


}

export default DtoCompte;