import prisma from '../prisma.js';
import bcrypt from 'bcryptjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { SERVER_FILES_PATH } from '../global_properties.js';

class DtoCompte {
    async creerCompte(compte) {
        // Validations
        if (!compte.nom || compte.nom.trim().length === 0) {
            throw new Error("Le nom est requis");
        }
        if (compte.nom.length > 100) {
            throw new Error("Le nom ne peut pas dépasser 100 caractères");
        }

        if (!compte.email || compte.email.trim().length === 0) {
            throw new Error("L'email est requis");
        }
        
        // Validation de format email simple
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(compte.email)) {
            throw new Error("L'email n'est pas valide");
        }

        if (!compte.mdp || compte.mdp.length === 0) {
            throw new Error("Le mot de passe est requis");
        }
        if (compte.mdp.length < 6) {
            throw new Error("Le mot de passe doit contenir au moins 6 caractères");
        }

        // Vérifier que l'email n'existe pas déjà
        const existant = await this.trouverParEmail(compte.email);
        if (existant) {
            throw new Error("Cet email est déjà utilisé");
        }

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

            // Créer une entrée dossier pour le dossier utilisateur (base + idDossierParent null)
            await tx.dossier.create({
                data: {
                    idCompteCreateur: created.idCompte,
                    cheminDaccesDossier: `user_${created.idCompte}`,
                    idDossierParent: null,
                },
            });

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

    async mettreAJourCompte(idCompte, donnees) {
        // Validations
        if (donnees.nom !== undefined) {
            if (donnees.nom.trim().length === 0) {
                throw new Error("Le nom ne peut pas être vide");
            }
            if (donnees.nom.length > 100) {
                throw new Error("Le nom ne peut pas dépasser 100 caractères");
            }
        }

        if (donnees.email !== undefined) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(donnees.email)) {
                throw new Error("L'email n'est pas valide");
            }

            // Vérifier que l'email n'est pas déjà utilisé par un autre compte
            const existant = await prisma.compte.findUnique({
                where: { adresseMailCompte: donnees.email },
            });
            if (existant && existant.idCompte !== parseInt(idCompte)) {
                throw new Error("Cet email est déjà utilisé");
            }
        }

        const dataUpdate = {};
        if (donnees.nom !== undefined) dataUpdate.nomCompte = donnees.nom;
        if (donnees.email !== undefined) dataUpdate.adresseMailCompte = donnees.email;

        return prisma.compte.update({
            where: { idCompte: parseInt(idCompte) },
            data: dataUpdate,
            select: {
                idCompte: true,
                nomCompte: true,
                adresseMailCompte: true,
                stockageCompte: true,
            },
        });
    }

    async changerMotDePasse(idCompte, ancienMdp, nouveauMdp) {
        const compte = await prisma.compte.findUnique({
            where: { idCompte: parseInt(idCompte) },
        });

        if (!compte) {
            throw new Error("Compte non trouvé");
        }

        // Vérifier que l'ancien mot de passe est correct
        const isValid = await bcrypt.compare(ancienMdp, compte.mdpCompte);
        if (!isValid) {
            throw new Error("L'ancien mot de passe est incorrect");
        }

        // Valider le nouveau mot de passe
        if (!nouveauMdp || nouveauMdp.length === 0) {
            throw new Error("Le nouveau mot de passe est requis");
        }
        if (nouveauMdp.length < 6) {
            throw new Error("Le nouveau mot de passe doit contenir au moins 6 caractères");
        }

        const hashedPassword = await bcrypt.hash(nouveauMdp, 10);

        return prisma.compte.update({
            where: { idCompte: parseInt(idCompte) },
            data: { mdpCompte: hashedPassword },
            select: {
                idCompte: true,
                nomCompte: true,
                adresseMailCompte: true,
            },
        });
    }

    async supprimerCompte(idCompte) {
        return prisma.compte.delete({
            where: { idCompte: parseInt(idCompte) },
        });
    }

    async mettreAJourAvatar(idCompte, buffer) {
        return prisma.compte.update({
            where: { idCompte: parseInt(idCompte) },
            data: { avatarBlobCompte: buffer },
            select: { idCompte: true }
        });
    }

    async recupererAvatar(idCompte) {
        return prisma.compte.findUnique({
            where: { idCompte: parseInt(idCompte) },
            select: { avatarBlobCompte: true }
        });
    }
}

export default DtoCompte;