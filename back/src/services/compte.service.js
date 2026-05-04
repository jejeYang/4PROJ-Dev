import CompteRepository from "../repositories/compte.repository.js";
import DossierService from "./dossier.service.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { SERVER_FILES_PATH, JWT_SECRET, GOOGLE_CLIENT_ID } from '../config/env.js';

class CompteService {
    constructor() {
        this.compteRepository = new CompteRepository();
        this.dossierService = new DossierService();
        this.jwtSecret = JWT_SECRET;
        this.googleClientId = GOOGLE_CLIENT_ID;
        this.googleClient = this.googleClientId ? new OAuth2Client(this.googleClientId) : null;
    }

    genererToken(utilisateur) {
        return jwt.sign(
            { id: utilisateur.id, nom: utilisateur.nom, email: utilisateur.email },
            this.jwtSecret,
            { expiresIn: '24h' }
        );
    }

    async creerCompte(compte) {
        // Validations (moved from DTO)
        if (!compte.nom || compte.nom.trim().length === 0) {
            throw new Error("Le nom est requis");
        }
        if (compte.nom.length > 100) {
            throw new Error("Le nom ne peut pas dépasser 100 caractères");
        }
        if (!compte.email || compte.email.trim().length === 0) {
            throw new Error("L'email est requis");
        }
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
        const existant = await this.compteRepository.findByEmail(compte.email);
        if (existant) {
            throw new Error("Cet email est déjà utilisé");
        }

        const hashedPassword = await bcrypt.hash(compte.mdp, 10);

        const utilisateur = await this.compteRepository.transaction(async (tx) => {
            const created = await tx.compte.create({
                data: {
                    nomCompte: compte.nom,
                    adresseMailCompte: compte.email,
                    mdpCompte: hashedPassword,
                    stockageCompte: 32212254720, // 30GB
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

        // Créer automatiquement un dossier corbeille (logic from ServiceCompte)
        try {
            await this.dossierService.creerDossier({
                idCompteCreateur: utilisateur.idCompte,
                cheminDaccesDossier: `.corbeille`,
            });
        } catch (error) {
            console.error('Erreur lors de la création du dossier corbeille:', error);
        }

        return utilisateur;
    }

    async recupererComptes() {
        return await this.compteRepository.findAll();
    }

    async trouverParEmail(email) {
        return await this.compteRepository.findByEmail(email);
    }

    async verifierMotDePasse(email, mdp) {
        const compte = await this.compteRepository.findByEmail(email);
        if (!compte) return null;

        const isValid = await bcrypt.compare(mdp, compte.mdpCompte);
        if (isValid) {
            return { id: compte.idCompte, nom: compte.nomCompte, email: compte.adresseMailCompte };
        }
        return null;
    }

    async authentifierUtilisateur(email, mdp) {
        const utilisateur = await this.verifierMotDePasse(email, mdp);
        if (utilisateur) {
            const token = this.genererToken(utilisateur);
            return { utilisateur, token };
        }
        return null;
    }

    async authentifierGoogle(idToken) {
        if (!this.googleClient || !this.googleClientId) {
            throw new Error('Google Auth non configuré sur le serveur');
        }

        const ticket = await this.googleClient.verifyIdToken({
            idToken,
            audience: this.googleClientId,
        });

        const payload = ticket.getPayload();
        if (!payload?.email || !payload.email_verified) {
            throw new Error('Compte Google invalide');
        }

        let compte = await this.compteRepository.findByEmail(payload.email);
        if (!compte) {
            const nouveauCompte = await this.creerCompte({
                nom: payload.name || payload.email.split('@')[0],
                email: payload.email,
                mdp: crypto.randomUUID(), // Assumes crypto is available globally or needs import
            });

            compte = {
                idCompte: nouveauCompte.idCompte,
                nomCompte: nouveauCompte.nomCompte,
                adresseMailCompte: nouveauCompte.adresseMailCompte,
            };
        }

        const utilisateur = {
            id: compte.idCompte,
            nom: compte.nomCompte,
            email: compte.adresseMailCompte,
        };

        return { utilisateur, token: this.genererToken(utilisateur) };
    }

    async mettreAJourCompte(idCompte, donnees) {
        // Validations moved from DTO
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

            const existant = await this.compteRepository.findByEmail(donnees.email);
            if (existant && existant.idCompte !== parseInt(idCompte)) {
                throw new Error("Cet email est déjà utilisé");
            }
        }

        const dataUpdate = {};
        if (donnees.nom !== undefined) dataUpdate.nomCompte = donnees.nom;
        if (donnees.email !== undefined) dataUpdate.adresseMailCompte = donnees.email;

        return await this.compteRepository.update(idCompte, dataUpdate);
    }

    async changerMotDePasse(idCompte, ancienMdp, nouveauMdp) {
        const compte = await this.compteRepository.findById(idCompte);
        if (!compte) {
            throw new Error("Compte non trouvé");
        }

        const isValid = await bcrypt.compare(ancienMdp, compte.mdpCompte);
        if (!isValid) {
            throw new Error("L'ancien mot de passe est incorrect");
        }

        if (!nouveauMdp || nouveauMdp.length === 0) {
            throw new Error("Le nouveau mot de passe est requis");
        }
        if (nouveauMdp.length < 6) {
            throw new Error("Le nouveau mot de passe doit contenir au moins 6 caractères");
        }

        const hashedPassword = await bcrypt.hash(nouveauMdp, 10);
        return await this.compteRepository.update(idCompte, { mdpCompte: hashedPassword });
    }

    async supprimerCompte(idCompte) {
        return await this.compteRepository.delete(idCompte);
    }

    async mettreAJourAvatar(idCompte, buffer) {
        return await this.compteRepository.updateAvatar(idCompte, buffer);
    }

    async recupererAvatar(idCompte) {
        return await this.compteRepository.getAvatar(idCompte);
    }

    verifierToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        } catch (error) {
            console.error('Token verification failed:', error);
            return null;
        }
    }
}

export default CompteService;
