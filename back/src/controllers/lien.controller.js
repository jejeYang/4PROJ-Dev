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
            const { email, fileName, motDePasse, mdpLienGenere, dateExpiration } = req.body;
            const idUtilisateurAuthentifie = +req.utilisateur.id;

            if (!email) {
                return res.status(400).json({ error: 'Email requis pour le partage.' });
            }

            const dossier = await this.dossierService.recupererDossierParId(dossierId);
            if (dossier.idCompteCreateur !== idUtilisateurAuthentifie) {
                return res.status(403).json({ error: 'Vous ne pouvez partager que vos propres dossiers et fichiers.' });
            }

            const dossierCheminPhysique = path.join(SERVER_FILES_PATH, `user_${idUtilisateurAuthentifie}`, await this.dossierService.construireCheminComplet(dossierId));

            if (fileName) {
                const fichierPhysique = path.join(dossierCheminPhysique, fileName);
                if (!fs.existsSync(fichierPhysique) || !fs.statSync(fichierPhysique).isFile()) {
                    return res.status(404).json({ error: 'Le fichier à partager est introuvable.' });
                }
            }

            let expirationDate = null;
            if (dateExpiration) {
                expirationDate = new Date(dateExpiration);
                if (Number.isNaN(expirationDate.getTime())) {
                    return res.status(400).json({ error: 'dateExpiration invalide. Utilisez une date ISO valide.' });
                }
            }

            const type = fileName ? 'fichier' : 'dossier';
            const cheminDaccesLien = fileName ? `fichier:${dossierId}:${fileName}` : `dossier:${dossierId}`;
            const urlLienGenere = crypto.randomUUID();

            // Vérifier si l'email correspond à un compte existant
            const compteExistant = await this.compteService.trouverParEmail(email);

            if (compteExistant) {
                if (motDePasse || mdpLienGenere) {
                    return res.status(400).json({ error: 'Impossible de définir un mot de passe pour un partage vers un compte existant.' });
                }

                try {
                    if (fileName) {
                        await this.dossierService.copierFichierVersCompte(dossierId, fileName, compteExistant.idCompte);
                    } else {
                        await this.dossierService.copierDossierVersCompte(dossierId, compteExistant.idCompte);
                    }
                } catch (err) {
                    console.error('Erreur lors du partage vers compte existant :', err);
                    return res.status(500).json({ error: 'Erreur lors du partage vers ce compte.' });
                }

                return res.status(200).json({
                    message: 'Partage effectué avec succès. Le fichier/dossier a été ajouté à la racine de l\'utilisateur.',
                    lien: null,
                    sharedWithAccount: true,
                });
            }

            const motDePasseParamFinal = motDePasse || mdpLienGenere;
            const lien = await this.lienService.creerLien({
                idCompte: idUtilisateurAuthentifie,
                cheminDaccesLien,
                dateExpiration: expirationDate,
                mdpLienGenere: motDePasseParamFinal,
                urlLienGenere,
            });

            res.status(201).json({
                message: compteExistant 
                    ? 'Partage effectué avec succès. Le fichier/dossier a été ajouté à la racine de l\'utilisateur.' 
                    : 'Lien de partage créé avec succès.',
                lien: {
                    idLienGenere: lien.idLienGenere,
                    url: `/api/liens/${urlLienGenere}`,
                    type,
                    chemin: cheminDaccesLien,
                    protégé: Boolean(motDePasseParamFinal),
                    dateExpiration: expirationDate,
                    sharedWithAccount: Boolean(compteExistant),
                },
            });
        } catch (error) {
            next(error);
        }
    };

    accederLienPartage = async (req, res, next) => {
        try {
            const { token } = req.params;
            const authHeader = req.headers.authorization;
            let utilisateurConnecte = null;

            if (authHeader?.startsWith('Bearer ')) {
                const jwtToken = authHeader.split(' ')[1];
                utilisateurConnecte = this.compteService.verifierToken(jwtToken);
            }

            const lien = await this.lienService.recupererParToken(token);
            if (!lien) {
                return res.status(404).json({ error: 'Lien introuvable.' });
            }

            const password = req.query.password || req.query.motDePasse || req.headers['x-lien-password'];
            const isPasswordValid = await this.lienService.verifierMdpLien(password, lien.mdpLienGenere);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Mot de passe incorrect pour ce lien.' });
            }

            if (lien.dateExpiration && new Date(lien.dateExpiration) <= new Date()) {
                return res.status(410).json({ error: 'Ce lien a expiré.' });
            }

            const resource = this._parserCheminDaccesLien(lien.cheminDaccesLien);
            if (!resource) {
                return res.status(400).json({ error: 'Lien de partage invalide.' });
            }

            if (utilisateurConnecte?.id) {
                const cibleCompteId = +utilisateurConnecte.id;
                const resultat = await this._partagerRessourceVersUtilisateur(resource, cibleCompteId);
                return res.json(resultat);
            }

            if (resource.type === 'fichier') {
                return this._telechargerFichierPartage(resource, res, next);
            }

            return this._telechargerDossierPartage(resource, res, next);
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
