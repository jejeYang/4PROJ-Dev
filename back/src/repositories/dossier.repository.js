import prisma from '../prisma.js';

class DossierRepository {
    async create(data) {
        return prisma.dossier.create({
            data: {
                idCompteCreateur: data.idCompteCreateur,
                cheminDaccesDossier: data.cheminDaccesDossier,
                idDossierParent: data.idDossierParent || null,
                status: data.status || null,
            },
        });
    }

    async findAll() {
        return prisma.dossier.findMany();
    }

    async findById(id) {
        return prisma.dossier.findUniqueOrThrow({
            where: { idDossier: Number.parseInt(id) },
        });
    }

    async findByCompte(idCompte) {
        return prisma.dossier.findMany({
            where: { idCompteCreateur: Number.parseInt(idCompte) },
        });
    }

    async findSubDossiers(parentId) {
        return prisma.dossier.findMany({
            where: { idDossierParent: Number.parseInt(parentId) },
        });
    }

    async findRootByCompte(idCompte) {
        return prisma.dossier.findMany({
            where: {
                idCompteCreateur: Number.parseInt(idCompte),
                idDossierParent: null,
            },
        });
    }

    async update(id, data) {
        return prisma.dossier.update({
            where: { idDossier: Number.parseInt(id) },
            data: data,
        });
    }

    async delete(id) {
        return prisma.dossier.delete({
            where: { idDossier: Number.parseInt(id) },
        });
    }

    async findTrash(idCompte) {
        return prisma.dossier.findFirst({
            where: {
                idCompteCreateur: Number.parseInt(idCompte),
                cheminDaccesDossier: '.corbeille',
            },
        });
    }

    async findFirst(where) {
        return prisma.dossier.findFirst({
            where: where
        });
    }

    async findMany(where) {
        return prisma.dossier.findMany({
            where: where
        });
    }
}

export default DossierRepository;
