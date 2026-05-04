import path from 'node:path';
import fs, { promises as fsPromises } from 'node:fs';

/**
 * Parse a list of paths from various input formats.
 * @param {string|string[]} valeur 
 * @returns {string[]}
 */
export const parserListeChemins = (valeur) => {
    if (!valeur) return [];

    if (Array.isArray(valeur)) {
        return valeur.filter(v => typeof v === 'string');
    }

    if (typeof valeur === 'string') {
        try {
            const parse = JSON.parse(valeur);
            if (Array.isArray(parse)) {
                return parse.filter(v => typeof v === 'string');
            }
        } catch {
            return [valeur];
        }
    }

    return [];
};

/**
 * Normalize a relative path.
 * @param {string} cheminRelatif 
 * @returns {string|null}
 */
export const normaliserCheminRelatif = (cheminRelatif) => {
    if (typeof cheminRelatif !== 'string') return null;

    const cheminNettoye = cheminRelatif.trim();
    if (!cheminNettoye) return null;

    const normalise = path.normalize(cheminNettoye).replace(/^([/\\])+/, '');
    if (!normalise || normalise === '.') return null;

    return normalise;
};

/**
 * Resolve a secure path within a base directory.
 * @param {string} baseUtilisateur 
 * @param {string} cheminRelatif 
 * @returns {{absolu: string, relatif: string}|null}
 */
export const resoudreCheminSecurise = (baseUtilisateur, cheminRelatif) => {
    const relatif = normaliserCheminRelatif(cheminRelatif);
    if (!relatif) return null;

    const baseResolue = path.resolve(baseUtilisateur);
    const absolu = path.resolve(baseResolue, relatif);

    if (absolu !== baseResolue && !absolu.startsWith(`${baseResolue}${path.sep}`)) {
        return null;
    }

    return { absolu, relatif };
};

/**
 * Construct an archive name for a user.
 * @param {Object} utilisateur 
 * @param {number|string} idUtilisateur 
 * @returns {string}
 */
export const construireNomArchiveUtilisateur = (utilisateur, idUtilisateur) => {
    const depuisNom = typeof utilisateur?.nom === 'string' ? utilisateur.nom : '';
    const depuisEmail = typeof utilisateur?.email === 'string'
        ? utilisateur.email.split('@')[0]
        : '';

    const brut = (depuisNom || depuisEmail || `user_${idUtilisateur}`).trim();

    const ascii = brut
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Za-z0-9._-]+/g, '_')
        .replace(/^[_\-.]+|[_\-.]+$/g, '');

    return ascii || `user_${idUtilisateur}`;
};

/**
 * Generate a unique ZIP entry name.
 * @param {string} nomSouhaite 
 * @param {Set<string>} nomsUtilises 
 * @returns {string|null}
 */
export const genererNomUniqueZip = (nomSouhaite, nomsUtilises) => {
    const nomNettoye = (nomSouhaite || '').replace(/\\/g, '/').replace(/^[/]+|[/]+$/g, '');
    if (!nomNettoye) return null;

    const cleInitiale = nomNettoye.toLowerCase();
    if (!nomsUtilises.has(cleInitiale)) {
        nomsUtilises.add(cleInitiale);
        return nomNettoye;
    }

    const extension = path.extname(nomNettoye);
    const base = extension ? nomNettoye.slice(0, -extension.length) : nomNettoye;

    let compteur = 2;
    while (true) {
        const candidat = `${base} (${compteur})${extension}`;
        const cle = candidat.toLowerCase();
        if (!nomsUtilises.has(cle)) {
            nomsUtilises.add(cle);
            return candidat;
        }

        compteur += 1;
    }
};

/**
 * Build the full path of a folder by traversing up its parents.
 * Note: This depends on the service_dossier having a recupererDossierParId method.
 * @param {number|string} dossierId 
 * @param {Object} service_dossier 
 * @returns {Promise<string>}
 */
export const construireCheminComplet = async (dossierId, service_dossier) => {
    const dossier = await service_dossier.recupererDossierParId(dossierId);
    
    if (dossier.idDossierParent) {
        // Récursivement construire le chemin du parent
        const cheminParent = await construireCheminComplet(dossier.idDossierParent, service_dossier);
        return path.join(cheminParent, dossier.cheminDaccesDossier);
    } else {
        // C'est un dossier racine
        return dossier.cheminDaccesDossier;
    }
};
