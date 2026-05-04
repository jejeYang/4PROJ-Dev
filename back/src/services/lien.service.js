import LienRepository from "../repositories/lien.repository.js";
import bcrypt from 'bcryptjs';

class LienService {
    constructor() {
        this.lienRepository = new LienRepository();
    }

    async creerLien(lien) {
        const hashedPassword = lien.mdpLienGenere ? await bcrypt.hash(lien.mdpLienGenere, 10) : null;
        
        return await this.lienRepository.create({
            idCompte: lien.idCompte,
            cheminDaccesLien: lien.cheminDaccesLien,
            dateExpiration: lien.dateExpiration || null,
            mdpLienGenere: hashedPassword,
            urlLienGenere: lien.urlLienGenere || null,
        });
    }

    async verifierMdpLien(mdp, hash) {
        if (!hash) {
            return true;
        }
        if (!mdp) {
            return false;
        }
        return await bcrypt.compare(mdp, hash);
    }

    async recupererLiensCompte(idCompte) {
        return await this.lienRepository.findByCompte(idCompte);
    }

    async recupererLiens() {
        return await this.lienRepository.findAll();
    }

    async recupererParToken(token) {
        return await this.lienRepository.findByToken(token);
    }

    async marquerCommeUtilise(idLienGenere) {
        return await this.lienRepository.update(idLienGenere, {
            dateExpiration: new Date(),
        });
    }
}

export default LienService;
