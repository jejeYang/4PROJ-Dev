import path from 'node:path';
import fs from 'node:fs';
import { promises as fsPromises } from 'node:fs';
import crypto from 'node:crypto';
import archiver from 'archiver';
import LienService from '../services/lien.service.js';
import DossierService from '../services/dossier.service.js';
import CompteService from '../services/compte.service.js';
import { SERVER_FILES_PATH } from '../config/env.js';

class LienController {
    constructor() {
        this.lienService = new LienService();
        this.dossierService = new DossierService();
        this.compteService = new CompteService();
    }

    genererLienPartage = async (req, res, next) => {
        try {
            const { dossierId } = req.params;
            const { email, fileName, motDePasse, dateExpiration } = req.body;
            const idUtilisateur = +req.utilisateur.id;

            let resource;
            if (fileName) {
                resource = { type: 'fichier', dossierId: parseInt(dossierId), fileName };
            } else {
                resource = { type: 'dossier', dossierId: parseInt(dossierId) };
            }

            if (email) {
                // Partage à un utilisateur existant
                const cible = await this.compteService.trouverParEmail(email);
                if (cible) {
                    const result = await this._partagerRessourceVersUtilisateur(resource, cible.idCompte);
                    return res.json({ ...result, sharedWithAccount: true });
                }
            }

            // Génération d'un lien public (si pas d'email ou si compte n'existe pas)
            const token = crypto.randomBytes(16).toString('hex');
            const cheminDaccesLien = fileName ? `fichier:${dossierId}:${fileName}` : `dossier:${dossierId}`;
            const dateExpirationFormatee = dateExpiration ? new Date(dateExpiration) : null;

            const lien = await this.lienService.creerLien({
                idCompte: idUtilisateur,
                cheminDaccesLien: cheminDaccesLien,
                dateExpiration: dateExpirationFormatee,
                mdpLienGenere: motDePasse,
                urlLienGenere: token
            });

            res.json({
                message: 'Lien de partage généré.',
                lien: {
                    url: `/liens/${token}`,
                    token: token
                }
            });
        } catch (error) {
            next(error);
        }
    };

    listerRessourcesPartagees = async (req, res, next) => {
        try {
            const idUtilisateur = +req.utilisateur.id;
            const liens = await this.lienService.recupererLiensParCompte(idUtilisateur);
            
            const ressources = liens.map(lien => {
                const info = this._parserCheminDaccesLien(lien.cheminDaccesLien);
                return {
                    idLien: lien.idLienGenere,
                    token: lien.urlLienGenere,
                    url: `/partage/${lien.urlLienGenere}`,
                    type: info?.type,
                    nom: info?.fileName || 'Dossier',
                    dateExpiration: lien.dateExpiration,
                    protege: !!lien.mdpLienGenere,
                    createdAt: lien.dateCreation
                    };
                    });
            res.json(ressources);
        } catch (error) {
            next(error);
        }
    };

    accederLienPartage = async (req, res, next) => {
        try {
            const { token } = req.params;
            const { idDossier, fileName, download } = req.query; 
            const lien = await this.lienService.recupererParToken(token);

            if (!lien) {
                return res.status(404).json({ error: 'Lien introuvable.' });
            }

            // Vérification expiration
            if (lien.dateExpiration && new Date(lien.dateExpiration) <= new Date()) {
                return res.status(410).json({ error: 'Ce lien a expiré.' });
            }

            // Vérification mot de passe
            const password = req.query.password || req.headers['x-lien-password'];
            const isPasswordValid = await this.lienService.verifierMdpLien(password, lien.mdpLienGenere);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Mot de passe requis.', protege: true });
            }

            const resource = this._parserCheminDaccesLien(lien.cheminDaccesLien);
            if (!resource) {
                return res.status(400).json({ error: 'Lien de partage corrompu.' });
            }

            let targetDossierId = resource.dossierId;
            let targetFileName = resource.fileName;

            if (idDossier) {
                const isDescendant = await this.dossierService.estDescendant(idDossier, resource.dossierId);
                if (!isDescendant) {
                    return res.status(403).json({ error: 'Accès non autorisé.' });
                }
                targetDossierId = parseInt(idDossier, 10);
            }

            if (fileName) {
                targetFileName = fileName;
            }

            if (targetFileName) {
                const dossier = await this.dossierService.recupererDossierParId(targetDossierId);
                const sourcePath = await this.dossierService.construireCheminComplet(targetDossierId);
                const cheminFichierPhysique = path.join(SERVER_FILES_PATH, `user_${dossier.idCompteCreateur}`, sourcePath, targetFileName);

                if (!fs.existsSync(cheminFichierPhysique) || !fs.statSync(cheminFichierPhysique).isFile()) {
                    return res.status(404).json({ error: 'Fichier introuvable.' });
                }

                if (download === 'true') {
                    res.download(cheminFichierPhysique, targetFileName);
                } else {
                    res.sendFile(cheminFichierPhysique);
                }
            } else {
                await this._telechargerDossierPartage({ dossierId: targetDossierId }, res, next);
            }
        } catch (error) {
            next(error);
        }
    };

    obtenirDetailsLien = async (req, res, next) => {
        try {
            const { token } = req.params;
            const { idSousDossier } = req.query; // Permet de naviguer dans les sous-dossiers
            const lien = await this.lienService.recupererParToken(token);

            if (!lien) {
                return res.status(404).json({ error: 'Lien introuvable.' });
            }

            // Vérification expiration
            if (lien.dateExpiration && new Date(lien.dateExpiration) <= new Date()) {
                return res.status(410).json({ error: 'Ce lien a expiré.' });
            }

            // Vérification mot de passe
            const password = req.query.password || req.headers['x-lien-password'];
            const isPasswordValid = await this.lienService.verifierMdpLien(password, lien.mdpLienGenere);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Mot de passe requis.', protege: true });
            }

            const resource = this._parserCheminDaccesLien(lien.cheminDaccesLien);
            if (!resource) {
                return res.status(400).json({ error: 'Lien de partage corrompu.' });
            }

            // Si un idSousDossier est fourni, on vérifie qu'il appartient bien au partage original
            let idDossierAExplorer = resource.dossierId;
            if (idSousDossier) {
                const isDescendant = await this.dossierService.estDescendant(idSousDossier, resource.dossierId);
                if (!isDescendant) {
                    return res.status(403).json({ error: 'Accès non autorisé à ce dossier.' });
                }
                idDossierAExplorer = parseInt(idSousDossier, 10);
            }

            // Récupération des infos de la ressource
            if (resource.type === 'fichier' && !idSousDossier) {
                const dossier = await this.dossierService.recupererDossierParId(resource.dossierId);
                const sourcePath = await this.dossierService.construireCheminComplet(resource.dossierId);
                const cheminPhysique = path.join(SERVER_FILES_PATH, `user_${dossier.idCompteCreateur}`, sourcePath, resource.fileName);

                if (!fs.existsSync(cheminPhysique)) {
                    return res.status(404).json({ error: 'Le fichier partagé n\'existe plus physiquement.' });
                }

                const stats = fs.statSync(cheminPhysique);
                return res.json({
                    type: 'fichier',
                    nom: resource.fileName,
                    taille: stats.size,
                    dateModification: stats.mtime,
                    token: token
                });
            } else {
                // C'est un dossier (ou on explore un sous-dossier d'un partage)
                const dossier = await this.dossierService.recupererDossierParId(idDossierAExplorer);
                const fichiers = await this.dossierService.recupererFichiersDossier(idDossierAExplorer);
                const sousDossiers = await this.dossierService.recupererSousDossiers(idDossierAExplorer);

                return res.json({
                    type: 'dossier',
                    nom: dossier.cheminDaccesDossier,
                    idDossier: idDossierAExplorer,
                    idDossierParent: dossier.idDossierParent, // Pour pouvoir remonter
                    isRacinePartage: idDossierAExplorer === resource.dossierId,
                    fichiers: fichiers,
                    sousDossiers: sousDossiers,
                    token: token
                });
            }
        } catch (error) {
            next(error);
        }
    };

    _parserCheminDaccesLien = (chemin) => {
        if (typeof chemin !== 'string') return null;
        if (chemin.startsWith('dossier:')) {
            const idDossier = parseInt(chemin.split(':')[1], 10);
            return { type: 'dossier', dossierId: idDossier };
        }
        if (chemin.startsWith('fichier:')) {
            const [_, dossierId, ...nomParts] = chemin.split(':');
            return { type: 'fichier', dossierId: parseInt(dossierId, 10), fileName: nomParts.join(':') };
        }
        return null;
    };

    async _partagerRessourceVersUtilisateur(resource, cibleCompteId) {
        if (resource.type === 'fichier') {
            const partage = await this.dossierService.copierFichierVersCompte(resource.dossierId, resource.fileName, cibleCompteId);
            return {
                message: 'Fichier partagé avec succès dans votre espace.',
                partage,
            };
        }

        const partage = await this.dossierService.copierDossierVersCompte(resource.dossierId, cibleCompteId);
        return {
            message: 'Dossier partagé avec succès dans votre espace.',
            partage,
        };
    }

    _telechargerFichierPartage = async (resource, res, next) => {
        try {
            const dossier = await this.dossierService.recupererDossierParId(resource.dossierId);
            const sourcePath = await this.dossierService.construireCheminComplet(resource.dossierId);
            const cheminFichierPhysique = path.join(SERVER_FILES_PATH, `user_${dossier.idCompteCreateur}`, sourcePath, resource.fileName);

            if (!fs.existsSync(cheminFichierPhysique) || !fs.statSync(cheminFichierPhysique).isFile()) {
                return res.status(404).json({ error: 'Fichier introuvable.' });
            }

            res.download(cheminFichierPhysique, resource.fileName);
        } catch (error) {
            next(error);
        }
    };

    _telechargerDossierPartage = async (resource, res, next) => {
        try {
            const dossier = await this.dossierService.recupererDossierParId(resource.dossierId);
            const sourcePath = await this.dossierService.construireCheminComplet(resource.dossierId);
            const dossierPhysique = path.join(SERVER_FILES_PATH, `user_${dossier.idCompteCreateur}`, sourcePath);

            if (!fs.existsSync(dossierPhysique) || !fs.statSync(dossierPhysique).isDirectory()) {
                return res.status(404).json({ error: 'Dossier introuvable.' });
            }

            const nomArchive = `${path.basename(sourcePath)}.zip`;
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${nomArchive}"`);

            const archive = archiver('zip', { zlib: { level: 9 } });
            archive.on('error', (archiveError) => {
                console.error('Erreur lors de la création de l\'archive ZIP :', archiveError);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Erreur lors de la création de l\'archive ZIP' });
                }
            });

            archive.pipe(res);
            archive.directory(dossierPhysique, path.basename(sourcePath));
            await archive.finalize();
        } catch (error) {
            next(error);
        }
    };
}

export default new LienController();