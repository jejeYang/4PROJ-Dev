import { JWT_SECRET } from '../global_properties.js';
import DtoDossier from "../dto/dossier.js";

class ServiceDossier {
    constructor() {
        this.dto_dossier = new DtoDossier();
        this.jwtSecret = JWT_SECRET;
    }

    async creerDossier(dossier) {
        return await this.dto_dossier.creerDossier(dossier);
    }

    async recupererDossiers() {
        return await this.dto_dossier.recupererDossiers();
    }

    async recupererDossierParId(dossierId) {
        return await this.dto_dossier.recupererDossierParId(dossierId);
    }

    async recupererDossiersParCompte(idCompteCreateurDossier) {
        return await this.dto_dossier.recupererDossierCompte(idCompteCreateurDossier);
    }

    async recupererSousDossiers(dossierId) {
        return await this.dto_dossier.recupererSousDossiers(dossierId);
    }

    async mettreAJourDossier(dossierId, cheminDaccesDossier) {
        return await this.dto_dossier.mettreAJourDossier(dossierId, cheminDaccesDossier);
    }

    async supprimerDossier(dossierId) {
        return await this.dto_dossier.supprimerDossier(dossierId);
    }

    async televerserFichier(dossierId, file) {
        return await this.dto_dossier.televerserFichier(dossierId, file);
    }

    async recupererEndpoints(dossierId) {
        return await this.dto_dossier.recupererEndpoints(dossierId);
    }

    async recupererFichiers(dossierId,endpoint) {
        return await this.dto_dossier.recupererFichiers(dossierId,endpoint);
    }

    async supprimerFichier(dossierId, path) {
        return await this.dto_dossier.supprimerFichier(dossierId, path);
    }

}

export default ServiceDossier;