import prisma from '../prisma.js';

class LienRepository {
    async create(data) {
        return prisma.lienGenere.create({
            data: {
                idCompte: data.idCompte,
                cheminDaccesLien: data.cheminDaccesLien,
                dateExpiration: data.dateExpiration || null,
                mdpLienGenere: data.mdpLienGenere || null,
                urlLienGenere: data.urlLienGenere || null,
            },
        });
    }

    async findByCompte(idCompte) {
        return prisma.lienGenere.findMany({
            where: { idCompte: parseInt(idCompte) },
        });
    }

    async findByToken(token) {
        return prisma.lienGenere.findFirst({
            where: { urlLienGenere: token },
        });
    }

    async update(id, data) {
        return prisma.lienGenere.update({
            where: { idLienGenere: Number.parseInt(id) },
            data,
        });
    }

    async findAll() {
        return prisma.lienGenere.findMany();
    }
}

export default LienRepository;
