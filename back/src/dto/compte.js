import prisma from '../prisma.js';
import bcrypt from 'bcryptjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { SERVER_FILES_PATH } from '../global_properties.js';

class DtoCompte {
    async creerCompte(compte) {
        const hashedPassword = await bcrypt.hash(compte.mdp, 10);

        const resultat = await prisma.$transaction(async (tx) => {
            const created = await tx.compte.create({
                data: {
                    nomCompte: compte.nom,
                    adresseMailCompte: compte.email,
                    mdpCompte: hashedPassword,
                    stockageCompte: compte.stockage ?? 0,
                },
            });

            const cheminDossierUtilisateur = path.join(SERVER_FILES_PATH, `user_${created.idCompte}`);
            await fs.mkdir(cheminDossierUtilisateur, { recursive: true });

            return created;
        });

        return resultat;
    }

    async recupererComptes() {
        return prisma.compte.findMany({
            select: {
                idCompte: true,
                nomCompte: true,
                adresseMailCompte: true,
                stockageCompte: true,
            },
        });
    }

    async trouverParEmail(email) {
        return prisma.compte.findUnique({
            where: { adresseMailCompte: email },
        });
    }

    async verifierMotDePasse(email, mdp) {
        const compte = await this.trouverParEmail(email);
        if (!compte) return null;

        const isValid = await bcrypt.compare(mdp, compte.mdpCompte);
        if (isValid) {
            return { id: compte.idCompte, nom: compte.nomCompte, email: compte.adresseMailCompte };
        }
        return null;
    }
}

export default DtoCompte;