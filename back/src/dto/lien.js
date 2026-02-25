import prisma from '../prisma.js';
import bcrypt from 'bcryptjs';

class DtoLienGenere {
    async creerLien(lien) {
        return prisma.lienGenere.create({
            data: {
                idCompte: lien.idCompte,
                cheminDaccesLien: lien.cheminDaccesLien,
                dateExpiration: lien.dateExpiration || null,
                mdpLienGenere: lien.mdpLienGenere ? await bcrypt.hash(lien.mdpLienGenere, 10) : null,
                urlLienGenere: lien.urlLienGenere || null,
            },
        });
    }

    async recupererLiensCompte(idCompte) {
        return prisma.lienGenere.findMany({
            where: { idCompte: parseInt(idCompte) },
        });
    }

    async recupererLiens() {
        return prisma.lienGenere.findMany();
    }
}

export default DtoLienGenere;