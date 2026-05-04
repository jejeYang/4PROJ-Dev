import prisma from '../prisma.js';

class CompteRepository {
    async create(data) {
        return prisma.compte.create({
            data: {
                nomCompte: data.nom,
                adresseMailCompte: data.email,
                mdpCompte: data.hashedPassword,
                stockageCompte: data.stockage ?? 0,
            },
        });
    }

    async findAll() {
        return prisma.compte.findMany({
            select: {
                idCompte: true,
                nomCompte: true,
                adresseMailCompte: true,
                stockageCompte: true,
            },
        });
    }

    async findByEmail(email) {
        return prisma.compte.findUnique({
            where: { adresseMailCompte: email },
        });
    }

    async findById(id) {
        return prisma.compte.findUnique({
            where: { idCompte: parseInt(id) },
        });
    }

    async update(id, data) {
        return prisma.compte.update({
            where: { idCompte: parseInt(id) },
            data: data,
            select: {
                idCompte: true,
                nomCompte: true,
                adresseMailCompte: true,
                stockageCompte: true,
            },
        });
    }

    async delete(id) {
        return prisma.compte.delete({
            where: { idCompte: parseInt(id) },
        });
    }

    async updateAvatar(id, buffer) {
        return prisma.compte.update({
            where: { idCompte: parseInt(id) },
            data: { avatarBlobCompte: buffer },
            select: { idCompte: true }
        });
    }

    async getAvatar(id) {
        return prisma.compte.findUnique({
            where: { idCompte: parseInt(id) },
            select: { avatarBlobCompte: true }
        });
    }

    async transaction(callback) {
        return prisma.$transaction(callback);
    }
}

export default CompteRepository;
