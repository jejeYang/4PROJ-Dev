import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import archiver from 'archiver';
import LienService from '../services/lien.service.js';
import CompteService from '../services/compte.service.js';
import DossierService from '../services/dossier.service.js';
import { SERVER_FILES_PATH } from '../config/env.js';

class LienController {
    constructor() {
        this.lienService = new LienService();
        this.compteService = new CompteService();
        this.dossierService = new DossierService();
    }

    // ==========================================
    // PARTAGE INTERNE (ENTRE UTILISATEURS)
    // ==========================================

    partagerVersUtilisateur = async (req, res, next) => {
        try {
            const { dossierId } = req.params;
            const { email, fileName } = req.body;
            const idProprietaire = +req.utilisateur.id;

            const dossierSource = await this.dossierService.recupererDossierParId(dossierId);
            if (dossierSource.idCompteCreateur !== idProprietaire) {
                return res.status(403).json({ error: "Vous n'êtes pas autorisé à partager ce dossier." });
            }

            // Partage uniquement pour les dossiers
            if (fileName) {
                return res.status(400).json({ 
                    error: "Le partage interne est limité aux dossiers. Veuillez placer votre fichier dans un dossier avant de le partager." 
                });
            }

            if (!email) {
                return res.status(400).json({ error: "L'email de destination est requis." });
            }

            const cible = await this.compteService.trouverParEmail(email);
            
            if (!cible) {
                return res.status(404).json({ 
                    error: "Aucun compte n'est associé à cette adresse email." 
                });
            }

            if (cible.idCompte === idProprietaire) {
                return res.status(400).json({ error: "Vous ne pouvez pas partager une ressource avec vous-même." });
            }

            // On délègue au DossierService qui va faire la copie physique et relier l'idDossierSource
            const partage = await this.dossierService.copierDossierVersCompte(parseInt(dossierId), cible.idCompte);
            
            res.json({
                message: "Dossier partagé avec succès.",
                partage
            });
        } catch (error) {
            next(error);
        }
    };

    getPartagesEnvoyes = async (req, res, next) => {
        try {
            const idUtilisateur = +req.utilisateur.id;
            const partages = await this.lienService.recupererPartagesEnvoyes(idUtilisateur);
            
            // Récupère l'email du compte qui a reçu l'accès
            const partagesAvecEmail = await Promise.all(partages.map(async (p) => {
                const compteCible = await this.compteService.compteRepository.findById(p.idCompteCreateur); // Celui qui détient la copie
                return { ...p, emailContact: compteCible?.adresseMailCompte };
            }));

            res.json(partagesAvecEmail);
        } catch (error) {
            next(error);
        }
    };

    getPartagesRecus = async (req, res, next) => {
        try {
            const idUtilisateur = +req.utilisateur.id;
            const partages = await this.lienService.recupererPartagesRecus(idUtilisateur);
            
            // Récupère l'email du compte qui a initié le partage (idCompteAcces)
            const partagesAvecEmail = await Promise.all(partages.map(async (p) => {
                const compteSource = await this.compteService.compteRepository.findById(p.idCompteAcces);
                return { ...p, emailContact: compteSource?.adresseMailCompte };
            }));

            res.json(partagesAvecEmail);
        } catch (error) {
            next(error);
        }
    };

    supprimerPartageInterne = async (req, res, next) => {
        try {
            const { dossierIdPartage } = req.params;
            const idDemandeur = +req.utilisateur.id;
            const dossier = await this.dossierService.recupererDossierParId(dossierIdPartage);
            if (dossier.idCompteCreateur !== idDemandeur && dossier.idCompteAcces !== idDemandeur) {
                return res.status(403).json({ error: "Vous n'avez pas l'autorisation d'annuler ce partage." });
            }
            await this.dossierService.supprimerDossier(dossierIdPartage);
            
            res.json({ message: "Le partage a été révoqué et supprimé pour l'ensemble des participants." });
        } catch (error) {
            next(error);
        }
    };

    // ==========================================
    // PARTAGE PAR LIEN (INVITÉS / PUBLIC)
    // ==========================================

    creerLienPublic = async (req, res, next) => {
        try {
            const { dossierId } = req.params;
            const { fileName, motDePasse, dateExpiration } = req.body;
            const idUtilisateur = +req.utilisateur.id;

            const dossierSource = await this.dossierService.recupererDossierParId(dossierId);
            if (dossierSource.idCompteCreateur !== idUtilisateur) {
                return res.status(403).json({ error: "Vous n'êtes pas autorisé à partager ce dossier." });
            }

            const token = crypto.randomBytes(16).toString('hex');
            const cheminDaccesLien = fileName ? `fichier:${dossierId}:${fileName}` : `dossier:${dossierId}`;

            const lien = await this.lienService.creerLien({
                idCompte: idUtilisateur,
                cheminDaccesLien: cheminDaccesLien,
                dateExpiration: dateExpiration ? new Date(dateExpiration) : null,
                mdpLienGenere: motDePasse,
                urlLienGenere: token
            });

            res.json({
                message: 'Lien de partage généré.',
                url: `/liens/${token}`,
                token: token
            });
        } catch (error) {
            next(error);
        }
    };

    getMesLiensPublics = async (req, res, next) => {
        try {
            const idUtilisateur = +req.utilisateur.id;
            const liens = await this.lienService.recupererLiensParCompte(idUtilisateur);
            
            // Récupère le nom du dossier à partir du chemin d'accès du lien
            const ressources = await Promise.all(liens.map(async (lien) => {
                const info = this._parserCheminDaccesLien(lien.cheminDaccesLien);
                
                let vraiNom = info?.fileName || 'Ressource inconnue';
                if (info?.type === 'dossier') {
                    try {
                        const dossierSource = await this.dossierService.recupererDossierParId(info.dossierId);
                        vraiNom = dossierSource.cheminDaccesDossier;
                    } catch (e) {
                        vraiNom = 'Dossier introuvable';
                    }
                }

                return {
                    idLien: lien.idLienGenere,
                    token: lien.urlLienGenere,
                    url: `/liens/${lien.urlLienGenere}`,
                    type: info?.type,
                    nom: vraiNom,
                    dateExpiration: lien.dateExpiration,
                    protege: !!lien.mdpLienGenere,
                    createdAt: lien.dateCreation
                };
            }));
            res.json(ressources);
        } catch (error) {
            next(error);
        }
    };

    supprimerLienPublic = async (req, res, next) => {
        try {
            const { idLien } = req.params;
            const idUtilisateur = +req.utilisateur.id;

            await this.lienService.supprimerLienSpecifique(idLien, idUtilisateur);
            res.json({ message: "Lien de partage supprimé avec succès." });
        } catch (error) {
            next(error);
        }
    };

    // ==========================================
    // ACCÈS INVITÉS (LECTURE SEULE)
    // ==========================================

    accederLienPartage = async (req, res, next) => {
        try {
            const { token } = req.params;
            const { download, idDossier, fileName } = req.query; 
            const lien = await this.lienService.recupererParToken(token);

            if (!lien) return res.status(404).json({ error: 'Lien introuvable.' });
            if (lien.dateExpiration && new Date(lien.dateExpiration) <= new Date()) {
                return res.status(410).json({ error: 'Ce lien a expiré.' });
            }

            const password = req.query.password || req.headers['x-lien-password'];
            const isPasswordValid = await this.lienService.verifierMdpLien(password, lien.mdpLienGenere);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Mot de passe requis.', protege: true });
            }

            const resource = this._parserCheminDaccesLien(lien.cheminDaccesLien);
            if (!resource) return res.status(400).json({ error: 'Lien corrompu.' });

            if (resource.type === 'fichier') {
                const dossier = await this.dossierService.recupererDossierParId(resource.dossierId);
                const sourcePath = await this.dossierService.construireCheminComplet(resource.dossierId);
                const cheminFichier = path.join(SERVER_FILES_PATH, `user_${dossier.idCompteCreateur}`, sourcePath, resource.fileName);
                
                if (!fs.existsSync(cheminFichier)) return res.status(404).json({ error: 'Fichier introuvable.' });
                if (download === 'true') res.download(cheminFichier, resource.fileName);
                else res.sendFile(cheminFichier);
            } else {
                let cibleId = resource.dossierId;
                
                // Vérifie si l'utilisateur veut accéder à un sous-dossier et s'assure que c'est un descendant du dossier partagé
                if (idDossier && idDossier !== String(resource.dossierId)) {
                    const estDescendant = await this.dossierService.estDescendant(idDossier, resource.dossierId);
                    if (!estDescendant) return res.status(403).json({ error: 'Accès non autorisé.' });
                    cibleId = parseInt(idDossier, 10);
                }

                const dossier = await this.dossierService.recupererDossierParId(cibleId);
                const sourcePath = await this.dossierService.construireCheminComplet(cibleId);

                if (fileName) {
                    // Téléchargement d'un fichier spécifique dans le dossier
                    const cheminFichier = path.join(SERVER_FILES_PATH, `user_${dossier.idCompteCreateur}`, sourcePath, fileName);
                    if (!fs.existsSync(cheminFichier)) return res.status(404).json({ error: 'Fichier introuvable.' });

                    if (download === 'true') res.download(cheminFichier, fileName);
                    else res.sendFile(cheminFichier);
                } else {
                    // Téléchargement du dossier entier en ZIP
                    const dossierPhysique = path.join(SERVER_FILES_PATH, `user_${dossier.idCompteCreateur}`, sourcePath);
                    const nomArchive = `${path.basename(sourcePath)}.zip`;
                    res.setHeader('Content-Type', 'application/zip');
                    res.setHeader('Content-Disposition', `attachment; filename="${nomArchive}"`);
                    
                    const archive = archiver('zip', { zlib: { level: 9 } });
                    archive.pipe(res);
                    archive.directory(dossierPhysique, path.basename(sourcePath));
                    await archive.finalize();
                }
            }
        } catch (error) {
            next(error);
        }
    };

    obtenirDetailsLien = async (req, res, next) => {
        try {
            const { token } = req.params;
            const { idSousDossier } = req.query;
            const lien = await this.lienService.recupererParToken(token);

            if (!lien) return res.status(404).json({ error: 'Lien introuvable.' });
            if (lien.dateExpiration && new Date(lien.dateExpiration) <= new Date()) {
                return res.status(410).json({ error: 'Ce lien a expiré.' });
            }

            const password = req.query.password || req.headers['x-lien-password'];
            const isPasswordValid = await this.lienService.verifierMdpLien(password, lien.mdpLienGenere);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Mot de passe requis.', protege: true });
            }

            const resource = this._parserCheminDaccesLien(lien.cheminDaccesLien);
            if (!resource) return res.status(400).json({ error: 'Lien corrompu.' });

            if (resource.type === 'fichier') {
                const dossier = await this.dossierService.recupererDossierParId(resource.dossierId);
                const sourcePath = await this.dossierService.construireCheminComplet(resource.dossierId);
                const chemin = path.join(SERVER_FILES_PATH, `user_${dossier.idCompteCreateur}`, sourcePath, resource.fileName);
                const stats = fs.statSync(chemin);
                
                res.json({ type: 'fichier', nom: resource.fileName, taille: stats.size, dateModification: stats.mtime });
            } else {
                let cibleId = resource.dossierId;
                let isRacinePartage = true;

                // Navigation dans un sous-dossier
                if (idSousDossier && idSousDossier !== String(resource.dossierId)) {
                    const estDescendant = await this.dossierService.estDescendant(idSousDossier, resource.dossierId);
                    if (!estDescendant) return res.status(403).json({ error: "Accès non autorisé à ce sous-dossier." });
                    cibleId = parseInt(idSousDossier, 10);
                    isRacinePartage = false;
                }

                const dossier = await this.dossierService.recupererDossierParId(cibleId);
                const fichiers = await this.dossierService.recupererFichiersDossier(cibleId);
                const sousDossiers = await this.dossierService.recupererSousDossiers(cibleId);

                res.json({ 
                    type: 'dossier', 
                    nom: dossier.cheminDaccesDossier, 
                    idDossier: cibleId,
                    isRacinePartage,
                    fichiers,
                    sousDossiers 
                });
            }
        } catch (error) {
            next(error);
        }
    };

    _parserCheminDaccesLien = (chemin) => {
        if (typeof chemin !== 'string') return null;
        if (chemin.startsWith('dossier:')) {
            return { type: 'dossier', dossierId: parseInt(chemin.split(':')[1], 10) };
        }
        if (chemin.startsWith('fichier:')) {
            const [_, dossierId, ...nomParts] = chemin.split(':');
            return { type: 'fichier', dossierId: parseInt(dossierId, 10), fileName: nomParts.join(':') };
        }
        return null;
    };
}

export default new LienController();