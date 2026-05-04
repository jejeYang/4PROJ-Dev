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

    async findAll() {
        return prisma.lienGenere.findMany();
    }
}

export default LienRepository;
