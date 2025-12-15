import DtoCompte from "../dto/compte.js";

class ServiceCompte {
    constructor() {
        this.dto_compte = new DtoCompte();
    }

    creerCompte(compte) {
        return this.dto_compte.creerCompte(compte);
    }

    async recupererComptes() {
        return await this.dto_compte.recupererComptes();
    }
}

export default ServiceCompte;