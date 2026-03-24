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

    async recupererCorbeille(idCompteCreateur) {
        return prisma.dossier.findFirst({
            where: {
                idCompteCreateur: parseInt(idCompteCreateur),
                cheminDaccesDossier: '.corbeille',
            },
        });
    }

    async recupererDossiersCorbeille(idCompteCreateur) {
        const corbeille = await this.recupererCorbeille(idCompteCreateur);
        if (!corbeille) {
            return [];
        }
        return prisma.dossier.findMany({
            where: {
                idDossierParent: corbeille.idDossier,
            },
        });
    }

    async deplacerVersCorbeille(dossierId, idCompteCreateur) {
        const dossier = await this.recupererDossierParId(dossierId);
        const corbeille = await this.recupererCorbeille(idCompteCreateur);

        if (!corbeille) {
            throw new Error('Corbeille non trouvée pour cet utilisateur');
        }

        return prisma.dossier.update({
            where: { idDossier: parseInt(dossierId) },
            data: { idDossierParent: corbeille.idDossier },
        });
    }

    async restaurerDossier(dossierId) {
        const dossier = await this.recupererDossierParId(dossierId);

        // Restaurer vers le premier dossier racine de l'utilisateur
        const dossierRacine = await prisma.dossier.findFirst({
            where: {
                idCompteCreateur: dossier.idCompteCreateur,
                idDossierParent: null,
                cheminDaccesDossier: { not: '.corbeille' },
            },
        });

        return prisma.dossier.update({
            where: { idDossier: parseInt(dossierId) },
            data: { idDossierParent: dossierRacine ? dossierRacine.idDossier : null },
        });
    }

    async viderCorbeille(idCompteCreateur) {
        const corbeille = await this.recupererCorbeille(idCompteCreateur);
        if (!corbeille) {
            return [];
        }

        // Récupérer tous les dossiers de la corbeille
        const dossiersCorbeille = await prisma.dossier.findMany({
            where: { idDossierParent: corbeille.idDossier },
        });

        // Supprimer tous les dossiers de la corbeille
        const dossiersSupprimes = [];
        for (const dossier of dossiersCorbeille) {
            try {
                await this.supprimerDossier(dossier.idDossier);
                dossiersSupprimes.push(dossier);
            } catch (error) {
                console.error(`Erreur lors de la suppression du dossier ${dossier.idDossier}:`, error);
            }
        }

        return dossiersSupprimes;
    }

    async recupererTailleDossier(dossierId) {
        try {
            const dossier = await this.recupererDossierParId(dossierId);
            const cheminComplet = await this.construireCheminComplet(dossierId);
            const cheminPhysique = path.join(SERVER_FILES_PATH, `user_${dossier.idCompteCreateur}`, cheminComplet);

            if (!fs.existsSync(cheminPhysique)) {
                return 0;
            }

            const calculerTaille = (cheminDir) => {
                let tailleTotale = 0;
                const fichiers = fs.readdirSync(cheminDir);

                fichiers.forEach(fichier => {
                    const cheminFichier = path.join(cheminDir, fichier);
                    const stat = fs.statSync(cheminFichier);

                    if (stat.isDirectory()) {
                        // Récursivement calculer la taille des sous-dossiers
                        tailleTotale += calculerTaille(cheminFichier);
                    } else {
                        tailleTotale += stat.size;
                    }
                });

                return tailleTotale;
            };

            return calculerTaille(cheminPhysique);
        } catch (error) {
            console.error('Erreur lors de la récupération de la taille du dossier :', error);
            throw error;
        }
    }
}

export default DtoDossier;