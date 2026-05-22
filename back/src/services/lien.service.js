import LienRepository from "../repositories/lien.repository.js";
import DossierRepository from "../repositories/dossier.repository.js";
import bcrypt from 'bcryptjs';

class LienService {
    constructor() {
        this.lienRepository = new LienRepository();
        this.dossierRepository = new DossierRepository();
    }

    // ==========================================
    // LIENS DE PARTAGE (PUBLIC)
    // ==========================================

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
        if (!hash) return true;
        if (!mdp) return false;
        return await bcrypt.compare(mdp, hash);
    }

    async recupererLiensCompte(idCompte) {
        return await this.lienRepository.findByCompte(idCompte);
    }

    async recupererLiensParCompte(idCompte) {
        return await this.lienRepository.findByCompte(idCompte);
    }

    async recupererParToken(token) {
        return await this.lienRepository.findByToken(token);
    }

    async marquerCommeUtilise(idLienGenere) {
        return await this.lienRepository.update(idLienGenere, {
            dateExpiration: new Date(),
        });
    }

    async supprimerLienSpecifique(idLien, idDemandeur) {
        const lien = await this.lienRepository.findById(idLien);
        if (!lien) throw new Error("Lien introuvable");
        if (lien.idCompte !== idDemandeur) throw new Error("Vous n'êtes pas autorisé à supprimer ce lien.");
        
        return await this.lienRepository.delete(idLien);
    }

    async supprimerLiensDossier(dossierId) {
        return await this.lienRepository.deleteByDossierId(dossierId);
    }

    async supprimerLienFichier(dossierId, fileName) {
        const chemin = `fichier:${dossierId}:${fileName}`;
        return await this.lienRepository.deleteByChemin(chemin);
    }

    async supprimerLiensExpires() {
        return await this.lienRepository.deleteExpired(new Date());
    }

    // ==========================================
    // PARTAGES INTERNES (DOSSIERS)
    // ==========================================

    async recupererPartagesEnvoyes(idCompte) {
        return await this.dossierRepository.findMany({
            idCompteAcces: parseInt(idCompte),
            NOT: {
                idDossierSource: null
            }
        });
    }

    async recupererPartagesRecus(idCompte) {
        return await this.dossierRepository.findMany({
            idCompteCreateur: parseInt(idCompte),
            NOT: {
                idDossierSource: null
            }
        });
    }
}

export default LienService;
