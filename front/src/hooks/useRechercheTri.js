import { useState, useCallback } from 'react';
import axios from 'axios';
import { separerNomExtension } from '../utils/fichierUtils';

const API = 'http://localhost:3000';

export function useRechercheTri({ authHeader, dossier_actuel, dossier_racine, taille_dossiers, setError }) {
    const [tri_config, setTriConfig] = useState({ cle: 'nom', direction: 'asc' });
    const [recherche_active, setRechercheActive] = useState(false);
    const [resultats_recherche, setResultatsRecherche] = useState({ dossiers: [], fichiers: [] });
    const [chargement_recherche, setChargementRecherche] = useState(false);
    const [id_dossier_origine_recherche, setIdDossierOrigineRecherche] = useState(null);

    const demanderTri = (cle) => {
        let direction = 'asc';
        if (tri_config.cle === cle && tri_config.direction === 'asc') {
            direction = 'desc';
        }
        setTriConfig({ cle, direction });
    };

    const trierElements = useCallback((elements, type) => {
        if (!tri_config.cle) return elements;

        return [...elements].sort((a, b) => {
            let valA, valB;

            if (type === 'dossier') {
                if (tri_config.cle === 'nom') { 
                    valA = (a.cheminDaccesDossier || '').toLowerCase(); 
                    valB = (b.cheminDaccesDossier || '').toLowerCase(); 
                }
                else if (tri_config.cle === 'extension') { 
                    valA = ''; 
                    valB = ''; 
                }
                else if (tri_config.cle === 'dateCreation') { 
                    valA = new Date(a.dateCreation || 0).getTime(); 
                    valB = new Date(b.dateCreation || 0).getTime(); 
                }
                else if (tri_config.cle === 'modifieLe') { 
                    valA = new Date(a.modifieLe || 0).getTime(); 
                    valB = new Date(b.modifieLe || 0).getTime(); 
                }
                else if (tri_config.cle === 'taille') { 
                    valA = taille_dossiers[a.idDossier] || 0; 
                    valB = taille_dossiers[b.idDossier] || 0; 
                }
            } else {
                if (tri_config.cle === 'nom') { 
                    valA = (a.nom || '').toLowerCase(); 
                    valB = (b.nom || '').toLowerCase(); 
                }
                else if (tri_config.cle === 'extension') { 
                    valA = (separerNomExtension(a.nom).extension || '').toLowerCase(); 
                    valB = (separerNomExtension(b.nom).extension || '').toLowerCase(); 
                }
                else if (tri_config.cle === 'dateCreation') { 
                    valA = new Date(a.dateCreation || a.dateModification || 0).getTime(); 
                    valB = new Date(b.dateCreation || b.dateModification || 0).getTime(); 
                }
                else if (tri_config.cle === 'modifieLe') { 
                    valA = new Date(a.modifieLe || a.dateModification || 0).getTime(); 
                    valB = new Date(b.modifieLe || b.dateModification || 0).getTime(); 
                }
                else if (tri_config.cle === 'taille') { 
                    valA = a.taille || 0; 
                    valB = b.taille || 0; 
                }
            }

            if (valA < valB) return tri_config.direction === 'asc' ? -1 : 1;
            if (valA > valB) return tri_config.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [tri_config, taille_dossiers]);

    const lancerRecherche = async (query, type) => {
        const id_dossier_recherche = dossier_actuel ? dossier_actuel.idDossier : dossier_racine?.idDossier;
        if (!id_dossier_recherche) return;

        setChargementRecherche(true);
        try {
            const params = new URLSearchParams();
            if (query) params.append('q', query);
            if (type && type !== 'tout') params.append('type', type);

            const res = await axios.get(`${API}/api/dossiers/${id_dossier_recherche}/rechercher?${params}`, { headers: authHeader() });
            setResultatsRecherche(res.data);
            setRechercheActive(true);
            setIdDossierOrigineRecherche(id_dossier_recherche);
        } catch (erreur) {
            console.error('Erreur lors de la recherche :', erreur);
            setError(erreur.response?.data?.error || 'Erreur lors de la recherche');
        } finally {
            setChargementRecherche(false);
        }
    };

    const reinitialiserRecherche = () => {
        setRechercheActive(false);
        setResultatsRecherche({ dossiers: [], fichiers: [] });
        setIdDossierOrigineRecherche(null);
    };

    return {
        tri_config, demanderTri, trierElements,
        recherche_active, resultats_recherche, chargement_recherche, id_dossier_origine_recherche,
        lancerRecherche, reinitialiserRecherche
    };
}