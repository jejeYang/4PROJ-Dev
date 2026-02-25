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

// Fonction pour construire le chemin complet d'un dossier
async construireCheminComplet(dossierId) {
    const dossier = await this.recupererDossierParId(dossierId);
    
    if (dossier.iddossierparent) {
        // Récursivement construire le chemin du parent
        const cheminParent = await this.construireCheminComplet(dossier.iddossierparent);
        return path.join(cheminParent, dossier.chemindaccesdossier);
    } else {
        // C'est un dossier racine
        return dossier.chemindaccesdossier;
    }
}


async creerDossier(dossier) {
    try {
        // Vérifier si un dossier avec le même nom existe déjà chez l'utilisateur au même niveau
        const requeteVerification = `
            SELECT * FROM public.dossier 
            WHERE idcomptecreateur = $1 
            AND chemindaccesdossier = $2 
            AND iddossierparent IS NOT DISTINCT FROM $3`;
        
        const dossierExistant = await db.oneOrNone(requeteVerification, [
            dossier.idCompteCreateur, 
            dossier.cheminDaccesDossier, 
            dossier.idDossierParent || null
        ]);

        if (dossierExistant) {
            throw new Error(`Un dossier nommé "${dossier.cheminDaccesDossier}" existe déjà à cet emplacement`);
        }

        // Créer l'entrée en base de données
        const req = `
            INSERT INTO public.dossier (idcomptecreateur, chemindaccesdossier, iddossierparent) 
            VALUES ($1, $2, $3) RETURNING *`;
        const resultat = await db.one(req, [dossier.idCompteCreateur, dossier.cheminDaccesDossier, dossier.idDossierParent || null]);
        
        // Créer le dossier physique
        let cheminDossierPhysique;
        
        if (dossier.idDossierParent) {
            // Si le dossier a un parent, construire le chemin complet du parent
            const cheminParentComplet = await this.construireCheminComplet(dossier.idDossierParent);
            cheminDossierPhysique = path.join(SERVER_FILES_PATH, `user_${resultat.idcomptecreateur}`, cheminParentComplet, dossier.cheminDaccesDossier);
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
            const req = 'SELECT * FROM public.dossier WHERE idcomptecreateur = $1';
            return await db.manyOrNone(req, [idCompteCreateur]);
        } catch (error) {
            console.error('Erreur lors de la récupération des dossiers de l\'utilisateur :', error);
            throw error;
        }
    }

    async recupererDossiersRacineCompte(idCompteCreateur) {
        try {
            const req = 'SELECT * FROM public.dossier WHERE idcomptecreateur = $1 AND iddossierparent IS NULL';
            return await db.manyOrNone(req, [idCompteCreateur]);
        } catch (error) {
            console.error('Erreur lors de la récupération des dossiers racine de l\'utilisateur :', error);
            throw error;
        }
    }
    async deplacerVerCorbeille(dossierId, idCompteCreateur) {
        try {
            const corbeille = await this.recupererCorbeille(idCompteCreateur);
            
            const dossier = await this.recupererDossierParId(dossierId);
            
            const req = `
                UPDATE public.dossier 
                SET iddossierparent = $1, iddossierparentoriginal = $2
                WHERE iddossier = $3 
                RETURNING *`;
            return await db.one(req, [corbeille.iddossier, dossier.iddossierparent, dossierId]);
        } catch (error) {
            console.error('Erreur lors du déplacement vers la corbeille :', error);
            throw error;
        }
    }

    async restaurerDanCorbeille(dossierId) {
        try {
            const dossier = await this.recupererDossierParId(dossierId);
            
            const req = `
                UPDATE public.dossier 
                SET iddossierparent = $1, iddossierparentoriginal = NULL
                WHERE iddossier = $2 
                RETURNING *`;
            return await db.one(req, [dossier.iddossierparentoriginal, dossierId]);
        } catch (error) {
            console.error('Erreur lors de la restauration du dossier :', error);
            throw error;
        }
    }
    async viderCorbeille(idCompteCreateur) {
        try {
            const dossiersCorbeille = await this.recupererDossiersCorbeille(idCompteCreateur);
            
            // Supprimer chaque dossier
        const req = `DELETE FROM public.dossier WHERE iddossierparent = (SELECT iddossier FROM public.dossier WHERE idcomptecreateur = $1 AND chemindaccesdossier = '.corbeille_${idCompteCreateur}') RETURNING *`;
            return await db.manyOrNone(req, [idCompteCreateur]);
        } catch (error) {
            console.error('Erreur lors du vidage de la corbeille :', error);
            throw error;
        }
    }
    async recupererDossierParId(dossierId) {
        try {
            const req = 'SELECT * FROM public.dossier WHERE iddossier = $1';
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

    async recupererFichiersDossier(dossierId) {
        try {
            const dossier = await this.recupererDossierParId(dossierId);
            
            // Construire le chemin physique complet du dossier
            const cheminComplet = await this.construireCheminComplet(dossierId);
            const cheminPhysique = path.join(SERVER_FILES_PATH, `user_${dossier.idcomptecreateur}`, cheminComplet);
            
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