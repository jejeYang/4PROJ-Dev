import prisma from '../prisma.js';
import fs from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { SERVER_FILES_PATH } from '../global_properties.js';

class DtoDossier {
    async creerDossier(dossier) {
        if (!dossier.idCompteCreateur) {
            throw new Error("idCompteCreateur est requis");
        }

        const nomSafe = path.basename(dossier.cheminDaccesDossier);

        const resultat = await prisma.dossier.create({
            data: {
                idCompteCreateur: dossier.idCompteCreateur,
                cheminDaccesDossier: nomSafe,
                idDossierParent: dossier.idDossierParent || null,
            },
        });

        let cheminDossierPhysique;
        if (dossier.idDossierParent) {
            const dossierParent = await this.recupererDossierParId(dossier.idDossierParent);
            cheminDossierPhysique = path.join(
                SERVER_FILES_PATH,
                `user_${dossier.idCompteCreateur}`,
                dossierParent.cheminDaccesDossier,
                nomSafe
            );
        } else {
            cheminDossierPhysique = path.join(
                SERVER_FILES_PATH,
                `user_${dossier.idCompteCreateur}`,
                nomSafe
            );
        }

        await mkdir(cheminDossierPhysique, { recursive: true });

        return resultat;
    }

    async recupererDossiers() {
        return prisma.dossier.findMany();
    }

    async recupererDossierParId(dossierId) {
        return prisma.dossier.findUniqueOrThrow({
            where: { idDossier: parseInt(dossierId) },
        });
    }

    async recupererDossierCompte(idCompteCreateur) {
        return prisma.dossier.findMany({
            where: { idCompteCreateur: parseInt(idCompteCreateur) },
        });
    }

    async recupererSousDossiers(dossierId) {
        return prisma.dossier.findMany({
            where: { idDossierParent: parseInt(dossierId) },
        });
    }

    async recupererDossierRacineParCompte(idCompteCreateur) {
        return prisma.dossier.findMany({
            where: {
                idCompteCreateur: parseInt(idCompteCreateur),
                idDossierParent: null,
            },
        });
    }

    async mettreAJourDossier(dossierId, cheminDaccesDossier) {
        const nomSafe = path.basename(cheminDaccesDossier);
        return prisma.dossier.update({
            where: { idDossier: parseInt(dossierId) },
            data: { cheminDaccesDossier: nomSafe },
        });
    }

    async supprimerDossier(dossierId) {
        const dossier = await this.recupererDossierParId(dossierId);

        const cheminRelatif = await this.construireCheminComplet(dossierId);
        const chemin = path.join(
            SERVER_FILES_PATH,
            `user_${dossier.idCompteCreateur}`,
            cheminRelatif
        );

        try {
            if (fs.existsSync(chemin)) {
                fs.rmSync(chemin, { recursive: true, force: true });
            }
        } catch (e) {
            console.error("Erreur suppression dossier physique", e);
        }

        return prisma.dossier.delete({
            where: { idDossier: parseInt(dossierId) },
        });
    }

    async televerserFichier(dossierId, file) {
        const dossier = await this.recupererDossierParId(dossierId);
        return {
            message: 'Fichier téléversé avec succès',
            file: {
                originalName: file.originalname,
                filename: file.filename,
                size: file.size,
                mimetype: file.mimetype,
                path: file.path,
            },
            dossierId,
        };
    }

    async supprimerFichier(dossierId, filePath) {}
    async recupererEndpoints(dossierId) {}

    async construireCheminComplet(dossierId) {
        const dossier = await this.recupererDossierParId(dossierId);

        if (dossier.idDossierParent) {
            // Récursivement construire le chemin du parent
            const cheminParent = await this.construireCheminComplet(dossier.idDossierParent);
            return path.join(cheminParent, dossier.cheminDaccesDossier);
        } else {
            // C'est un dossier racine
            return dossier.cheminDaccesDossier;
        }
    }

    async recupererFichiersDossier(dossierId) {
        try {
            const dossier = await this.recupererDossierParId(dossierId);

            // Construire le chemin physique complet du dossier
            const cheminComplet = await this.construireCheminComplet(dossierId);
            const cheminPhysique = path.join(SERVER_FILES_PATH, `user_${dossier.idCompteCreateur}`, cheminComplet);

            // Lire les fichiers du dossier
            if (!fs.existsSync(cheminPhysique)) {
                return [];
            }

            const fichiers = fs.readdirSync(cheminPhysique).map(nom => {
                const cheminFichier = path.join(cheminPhysique, nom);
                const stat = fs.statSync(cheminFichier);

                if (!stat.isDirectory()) {
                    return {
                        nom: nom,
                        taille: stat.size,
                        dateModification: stat.mtime,
                        type: 'fichier'
                    };
                }
                return null;
            }).filter(f => f !== null);

            return fichiers;
        } catch (error) {
            console.error('Erreur lors de la récupération des fichiers :', error);
            throw error;
        }
    }
}

export default DtoDossier;