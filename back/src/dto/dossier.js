// Import de la variable de configuration
import { PG_CONFIG,SERVER_FILES_PATH } from '../global_properties.js';
import pgPromise from 'pg-promise';
import fs from 'fs';
import path from 'path';

const pgp = pgPromise(/* initialization options */);
const db = pgp(PG_CONFIG);

// La classe DTO pour le dossier
class DtoDossier {
    constructor(idDossier, idCompteCreateurDossier, cheminDaccesDossier) {
        this.idDossier = idDossier;
        this.idCompteCreateurDossier = idCompteCreateurDossier;
        this.cheminDaccesDossier = cheminDaccesDossier;
    }

    async creerDossier(dossier) {
        try {
            // Créer l'entrée en base de données
            const req = `
                INSERT INTO public.dossier (idCompteCreateur, cheminDaccesDossier, idDossierParent) 
                VALUES ($1, $2, $3) RETURNING *`;
            const resultat = await db.one(req, [dossier.idCompteCreateur, dossier.cheminDaccesDossier, dossier.idDossierParent || null]);
            
            // Créer le dossier physique dans le dossier utilisateur
            let cheminDossierPhysique;
            
            if (dossier.idDossierParent) {
                // Si le dossier a un parent, on le crée dans le parent
                const dossierParent = await this.recupererDossierParId(dossier.idDossierParent);
                const cheminParent = path.join(SERVER_FILES_PATH, `user_${resultat.idcomptecreateur}`, dossierParent.chemindaccesdossier);
                cheminDossierPhysique = path.join(cheminParent, dossier.cheminDaccesDossier);
            } else {
                // Sinon, on le crée directement dans le dossier utilisateur
                // Structure: user_{idCompte}/cheminDaccesDossier
                cheminDossierPhysique = path.join(SERVER_FILES_PATH, `user_${resultat.idcomptecreateur}`, dossier.cheminDaccesDossier);
            }
            
            if (!fs.existsSync(cheminDossierPhysique)) {
                fs.mkdirSync(cheminDossierPhysique, { recursive: true });
            }
            
            return resultat;
        } catch (error) {
            console.error('Erreur lors de la création du dossier :', error);
            throw error;
        }
    }

    async recupererDossierCompte(idCompteCreateur) {
        try {
            const req = 'SELECT * FROM public.dossier WHERE idCompteCreateur = $1';
            return await db.manyOrNone(req, [idCompteCreateur]);
        } catch (error) {
            console.error('Erreur lors de la récupération des dossiers de l\'utilisateur :', error);
            throw error;
        }
    }

    async recupererDossierParId(dossierId) {
        try {
            const req = 'SELECT * FROM public.dossier WHERE idDossier = $1';
            return await db.one(req, [dossierId]);
        } catch (error) {
            console.error('Erreur lors de la récupération du dossier :', error);
            throw error;
        }
    }
    async recupererDossiers() {
        try {
            const req = 'SELECT * FROM public.dossier';
            return await db.manyOrNone(req);
        } catch (error) {
            console.error('Erreur lors de la récupération de tous les dossiers :', error);
            throw error;
        }
    }

    async televerserFichier(dossierId, file) {
        // Implémentation du téléversement de fichiers avec multer
        try {
            // On récupère le dossier
            const req = 'SELECT idDossier, cheminDaccesDossier FROM public.dossier WHERE idDossier = $1';
            const dossier = await db.one(req, [dossierId]);
            
            // On retourne les informations du fichier téléversé
            return { 
                message: 'Fichier téléversé avec succès', 
                file: {
                    originalName: file.originalname,
                    filename: file.filename,
                    size: file.size,
                    mimetype: file.mimetype,
                    path: file.path
                },
                dossierId: dossierId
            };
        } catch (error) {
            console.error('Erreur lors du téléversement du fichier :', error);
            throw error;
        }
    }

    async mettreAJourDossier(dossierId, cheminDaccesDossier) {
        try {
            const req = `
                UPDATE public.dossier 
                SET cheminDaccesDossier = $1 
                WHERE idDossier = $2 
                RETURNING *`;
            return await db.one(req, [cheminDaccesDossier, dossierId]);
        } catch (error) {
            console.error('Erreur lors de la mise à jour du dossier :', error);
            throw error;
        }
    }

    async supprimerDossier(dossierId) {
        try {
            const req = 'DELETE FROM public.dossier WHERE idDossier = $1 RETURNING *';
            return await db.one(req, [dossierId]);
        } catch (error) {
            console.error('Erreur lors de la suppression du dossier :', error);
            throw error;
        }
    }

    async recupererSousDossiers(dossierId) {
        try {
            const req = 'SELECT * FROM public.dossier WHERE idDossierParent = $1';
            return await db.manyOrNone(req, [dossierId]);
        } catch (error) {
            console.error('Erreur lors de la récupération des sous-dossiers :', error);
            throw error;
        }
    }

    async recupererEndpoints(dossierId) {
        // Implémentation spécifique à la récupération des endpoints
    }
    async recupererFichiers(dossierId, endpoint) {
        // Implémentation spécifique à la récupération des fichiers
    }
    async supprimerFichier(dossierId, path) {
        // Implémentation spécifique à la suppression des fichiers
    }
}

export default DtoDossier;