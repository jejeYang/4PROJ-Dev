//Import de la variable de configuration
import { PG_CONFIG } from '../global_properties.js';
import pgPromise from 'pg-promise';

const pgp = pgPromise(/* initialization options */);
const db = pgp(PG_CONFIG);
// La class DTO pour le compte

class DtoLienGenere{
    constructor(idCompte, cheminDaccesLienGenere, idLienGenere) {
        this.idCompte = idCompte;
        this.cheminDaccesLienGenere = cheminDaccesLienGenere;
        this.idLienGenere = idLienGenere;
    }

    creerLien(lien) {
    // Simuler la sauvegarde d'un lien dans une base de données
    const req = `INSERT INTO public.liengenere (idCompte, cheminDaccesLienGenere) VALUES ('${lien.idCompte}', ${lien.cheminDaccesLienGenere}) RETURNING *`;
    let result = db.one(req);
    return result;
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
            throw er=ror;
        });
    }
    async recupererLiens() {
    // Simuler la récupération de tous les liens dans une base de données
    const req = 'SELECT * FROM public.liengenere"';
    return db.manyOrNone(req)
        .then(result => {
            return result;
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des liens:', error);
            throw error;
        });
}
}
export default DtoLienGenere;