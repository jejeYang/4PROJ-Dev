import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Comptes de test (mots de passe déjà hashés bcrypt)
    await prisma.compte.upsert({
        where: { adresseMailCompte: 'admin@supfile.com' },
        update: {},
        create: {
            nomCompte: 'Admin',
            adresseMailCompte: 'admin@supfile.com',
            mdpCompte: '$2b$10$X.QD4ujHKJGv3I4IcxIPw.vUqH5wgKPHqIu0VaU9XNYGdB35vb24m',
            stockageCompte: 1073741824,
        },
    });

    await prisma.compte.upsert({
        where: { adresseMailCompte: 'user@test.com' },
        update: {},
        create: {
            nomCompte: 'User Test',
            adresseMailCompte: 'user@test.com',
            mdpCompte: '$2b$10$Zk6jpVPkTlETh14xa5epquImN0Ol6Yh1AgUGjfkL2c6NWyMDiz3rm',
            stockageCompte: 5368709120,
        },
    });

    console.log('✅ Seed exécuté avec succès.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
