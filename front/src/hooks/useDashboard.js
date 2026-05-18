import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatFileSize, obtenirTypeFichier, tronquerNom, separerNomExtension, obtenirEmojiFichier } from '../utils/fichierUtils';

// ===== IMPORT SOUS-HOOKS ===== 
import { usePartage } from './usePartage';
import { useDragDrop } from './useDragDrop';
import { useSelectionMultiple } from './useSelectionMultiple';
import { useRechercheTri } from './useRechercheTri';

const API = 'http://localhost:3000';

export function useDashboard() {
    const navigate = useNavigate();

    // ===== ETATS PRINCIPAUX =====
    const [dossiers, setDossiers] = useState([]);
    const [fichiers_base, setFichiersBase] = useState([]);
    const [dossier_racine, setDossierRacine] = useState(null);
    const [corbeille_info, setCorbeilleInfo] = useState(null);

    const [dossier_actuel, setDossierActuel] = useState(null);
    const [contenu_dossier, setContenuDossier] = useState({ dossiers: [], fichiers: [] });
    const [fil_ariane, setFilAriane] = useState([]);

    const [taille_dossiers, setTailleDossiers] = useState({});
    const [action_en_cours, setActionEnCours] = useState({ active: false, type: '', progression: 0 });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [ouvre_modal, setOuvreModal] = useState({ type: null, data: null });
    const [creating, setCreating] = useState(false);

    const [menu_nom_dossier, setChangeNomDossier] = useState('');
    const [nouveau_nom, setRenommeDossier] = useState('');
    
    const [menu_options_dossier, setMenuOptionsDossier] = useState(null);
    const [menu_options_fichier, setMenuOptionsFichier] = useState(null);
    const [fichier_preview, setFichierPreview] = useState(null);
    const [chargement_preview, setChargementPreview] = useState(false);

    const [dossier_cible_deplacement, setDossierCibleDeplacement] = useState(null);
    const [chemin_deplacement, setCheminDeplacement] = useState([]);
    const [sous_dossiers_deplacement, setSousDossiersDeplacement] = useState([]);

    const authHeader = useCallback(() => {
        const token = localStorage.getItem('token');
        return { Authorization: `Bearer ${token}` };
    }, []);

    // ===== RAFRAICHISSEMENT =====
    const fetchData = useCallback(async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const response = await axios.get(`${API}/api/comptes/${user.id}/dossiers`, { headers: authHeader() });
            const allRoots = response.data || [];

            const racine = allRoots.find(d => d.cheminDaccesDossier === `user_${user.id}`);
            const corbeille = allRoots.find(d => d.cheminDaccesDossier === '.corbeille');

            if (corbeille) setCorbeilleInfo(corbeille);

            if (racine) {
                setDossierRacine(racine);

                const [resDossiersRacine, resFichiersRacine] = await Promise.all([
                    axios.get(`${API}/api/dossiers/${racine.idDossier}/sous-dossiers`, { headers: authHeader() }),
                    axios.get(`${API}/api/dossiers/${racine.idDossier}/fichiers`, { headers: authHeader() })
                ]);
                setDossiers(resDossiersRacine.data || []);
                setFichiersBase(resFichiersRacine.data || []);

                // Redirection
                const searchParams = new URLSearchParams(window.location.search);
                const dossierIdCible = searchParams.get('folder');

                if (dossierIdCible && String(dossierIdCible) !== String(racine.idDossier)) {
                    try {
                        // Récupère les infos du dossier ciblé pour vérifier son existence et obtenir son parent
                        const resDossier = await axios.get(`${API}/api/dossiers/${dossierIdCible}`, { headers: authHeader() });
                        const dossierCible = resDossier.data;

                        // Récupère les sous-dossiers et fichiers du dossier ciblé
                        const [resSousDossiersCible, resFichiersCible] = await Promise.all([
                            axios.get(`${API}/api/dossiers/${dossierIdCible}/sous-dossiers`, { headers: authHeader() }),
                            axios.get(`${API}/api/dossiers/${dossierIdCible}/fichiers`, { headers: authHeader() })
                        ]);

                        // Reconstruit le fil d'Ariane jusqu'à la racine
                        let breadcrumb = [dossierCible];
                        let currentParentId = dossierCible.idDossierParent;

                        while (currentParentId && String(currentParentId) !== String(racine.idDossier)) {
                            const parentRes = await axios.get(`${API}/api/dossiers/${currentParentId}`, { headers: authHeader() });
                            breadcrumb.unshift(parentRes.data);
                            currentParentId = parentRes.data.idDossierParent;
                        }

                        setDossierActuel(dossierCible);
                        setContenuDossier({ dossiers: resSousDossiersCible.data || [], fichiers: resFichiersCible.data || [] });
                        setFilAriane(breadcrumb);

                        // Nettoie l'URL pour éviter les problèmes de rafraîchissement ou de partage du lien
                        window.history.replaceState(null, '', window.location.pathname);
                        
                    } catch (erreur) {
                        console.error("Impossible de charger le dossier demandé, on affiche la racine.", erreur);
                        window.history.replaceState(null, '', window.location.pathname);
                    }
                }
            } else {
                setDossiers([]);
                setFichiersBase([]);
            }
        } catch (erreur) {
            console.error('Erreur lors de la récupération des données :', erreur);
            setError('Erreur lors du chargement des données.' + (erreur.response?.data?.error || erreur.message));
        } finally {
            setLoading(false);
        }
    }, [authHeader]);

    const rafraichirVueActuelle = async () => {
        await fetchData();
        if (dossier_actuel) {
            try {
                const [res_dossiers, res_fichiers] = await Promise.all([
                    axios.get(`${API}/api/dossiers/${dossier_actuel.idDossier}/sous-dossiers`, { headers: authHeader() }),
                    axios.get(`${API}/api/dossiers/${dossier_actuel.idDossier}/fichiers`, { headers: authHeader() })
                ]);
                setContenuDossier({ dossiers: res_dossiers.data || [], fichiers: res_fichiers.data || [] });
            } catch (erreur) {
                console.error('Erreur lors du rafraîchissement :', erreur);
                setError('Erreur lors du rafraîchissement.' + (erreur.response?.data?.error || erreur.message));
            }
        }
    };

    // ===== INITIALISATION DES SOUS-HOOKS =====
    const partage = usePartage({ authHeader, setError, setActionEnCours });
    
    const dragDrop = useDragDrop({ 
        authHeader, dossier_actuel, dossier_racine, setError, setContenuDossier, setFichiersBase, setTailleDossiers 
    });

    const rechercheTri = useRechercheTri({ 
        authHeader, dossier_actuel, dossier_racine, taille_dossiers, setError 
    });

    const { selection, setSelection, estSelectionne, switchSelection, toggleSelectionTout, ...selectionActions } = useSelectionMultiple({ 
        authHeader, dossier_actuel, dossier_racine, fil_ariane, setOuvreModal, setActionEnCours, rafraichirVueActuelle, setError 
    });

    // ===== EFFECTS =====
    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        const recupereTaille = async (list) => {
            if (!list || list.length === 0) return;
            const promises = list.map(async (dossier) => {
                try {
                    const res = await axios.get(`${API}/api/dossiers/${dossier.idDossier}/taille`, { headers: authHeader() });
                    return { id: dossier.idDossier, size: res.data.taille || 0 };
                } catch {
                    return { id: dossier.idDossier, size: 0 };
                }
            });
            const resultat = await Promise.all(promises);
            const updates = {};
            resultat.forEach(r => { if (r) updates[r.id] = r.size; });
            if (Object.keys(updates).length > 0) setTailleDossiers(prev => ({ ...prev, ...updates }));
        };

        const queue_fichiers = [...dossiers];
        if (corbeille_info) queue_fichiers.push(corbeille_info);
        recupereTaille(queue_fichiers);
        if (contenu_dossier?.dossiers) recupereTaille(contenu_dossier.dossiers);
    }, [dossiers, contenu_dossier, corbeille_info, authHeader]);

    // ===== NAVIGATION =====
    const gestionClicDossier = async (dossier) => {
        try {
            setSelection([]);
            const [res_dossiers, res_fichiers] = await Promise.all([
                axios.get(`${API}/api/dossiers/${dossier.idDossier}/sous-dossiers`, { headers: authHeader() }),
                axios.get(`${API}/api/dossiers/${dossier.idDossier}/fichiers`, { headers: authHeader() })
            ]);
            setDossierActuel(dossier);
            setContenuDossier({ dossiers: res_dossiers.data || [], fichiers: res_fichiers.data || [] });
            setFilAriane([...fil_ariane, dossier]);
        } catch (erreur) {
            console.error('Erreur lors de l\'ouverture du dossier :', erreur);
            setError("Erreur lors de l'ouverture du dossier" + (erreur.response?.data?.error || erreur.message));
        }
    };

    const gestionClicBreadcrumb = async (index) => {
        try {
            setSelection([]);
            if (rechercheTri.recherche_active && rechercheTri.id_dossier_origine_recherche) {
                if (rechercheTri.id_dossier_origine_recherche !== dossier_racine?.idDossier) {
                    const nouveau_breadcrumb = index === -1 ? [] : fil_ariane.slice(0, index + 1);
                    const origine_presente = nouveau_breadcrumb.some(d => d.idDossier === rechercheTri.id_dossier_origine_recherche);
                    if (!origine_presente) rechercheTri.reinitialiserRecherche();
                }
            }
            if (index === -1) {
                setDossierActuel(null);
                setContenuDossier({ dossiers: [], fichiers: [] });
                setFilAriane([]);
            } else {
                const nouveau_breadcrumb = fil_ariane.slice(0, index + 1);
                const dossier_selectionne = nouveau_breadcrumb[index];
                const [res_dossiers, res_fichiers] = await Promise.all([
                    axios.get(`${API}/api/dossiers/${dossier_selectionne.idDossier}/sous-dossiers`, { headers: authHeader() }),
                    axios.get(`${API}/api/dossiers/${dossier_selectionne.idDossier}/fichiers`, { headers: authHeader() })
                ]);
                setFilAriane(nouveau_breadcrumb);
                setDossierActuel(dossier_selectionne);
                setContenuDossier({ dossiers: res_dossiers.data || [], fichiers: res_fichiers.data || [] });
            }
        } catch (erreur) {
            console.error('Erreur lors de la navigation :', erreur);
            setError("Erreur lors de la navigation." + (erreur.response?.data?.error || erreur.message));
        }
    };

    const naviguerVersUpload = () => {
        navigate('/upload', { state: { dossierActuel: dossier_actuel, path: fil_ariane } });
    };

    // ===== DOSSIERS =====
    const gestionCreeDossier = async (e) => {
        e.preventDefault();
        const nom_dossier = menu_nom_dossier.trim();
        if (!nom_dossier) return setError('Le nom du dossier ne peut pas être vide');

        const liste_actuels = dossier_actuel ? contenu_dossier.dossiers : dossiers;
        if (liste_actuels.some(d => d.cheminDaccesDossier.toLowerCase() === nom_dossier.toLowerCase())) {
            return setError('Un dossier portant ce nom existe déjà à cet emplacement.');
        }

        setCreating(true); setError('');
        const id_parent = dossier_actuel ? dossier_actuel.idDossier : dossier_racine?.idDossier;

        try {
            const response = await axios.post(`${API}/api/dossiers`,
                { cheminDaccesDossier: nom_dossier, idDossierParent: id_parent }, { headers: authHeader() });

            if (dossier_actuel) setContenuDossier({ ...contenu_dossier, dossiers: [...contenu_dossier.dossiers, response.data] });
            else setDossiers([...dossiers, response.data]);
            setChangeNomDossier(''); setOuvreModal({ type: null, data: null });
        } catch (erreur) {
            console.error('Erreur lors de la création du dossier :', erreur);
            setError(erreur.response?.data?.error || 'Erreur lors de la création');
        } finally {
            setCreating(false);
        }
    };

    const ouvrirModalRenommerDossier = (dossier) => {
        setRenommeDossier(dossier.cheminDaccesDossier); setError('');
        setOuvreModal({ type: 'renommage-dossier', data: dossier }); setMenuOptionsDossier(null);
    };

    const confirmerRenommageDossier = async () => {
        const nom = nouveau_nom.trim();
        if (!nom) return setError('Nom vide invalide');
        
        try {
            const res = await axios.put(`${API}/api/dossiers/${ouvre_modal.data.idDossier}`, { cheminDaccesDossier: nom }, { headers: authHeader() });
            if (dossier_actuel) setContenuDossier(prev => ({ ...prev, dossiers: prev.dossiers.map(d => d.idDossier === ouvre_modal.data.idDossier ? res.data : d) }));
            else setDossiers(prev => prev.map(d => d.idDossier === ouvre_modal.data.idDossier ? res.data : d));
            setOuvreModal({ type: null, data: null });
        } catch (erreur) {
            console.error('Erreur lors du renommage du dossier :', erreur);
            setError(erreur.response?.data?.error || 'Erreur lors du renommage');
        }
    };

    const ouvrirModalSuppressionDossier = async (dossier) => {
        setError(''); setOuvreModal({ type: 'suppression-dossier', data: dossier }); setMenuOptionsDossier(null);
        try {
            await axios.delete(`${API}/api/dossiers/${dossier.idDossier}/vers-corbeille`, { headers: authHeader() });
            if (dossier_actuel) setContenuDossier(prev => ({ ...prev, dossiers: prev.dossiers.filter(d => d.idDossier !== dossier.idDossier) }));
            else setDossiers(prev => prev.filter(d => d.idDossier !== dossier.idDossier));
            setSelection(prev => prev.filter(s => !(s.type === 'dossier' && s.item.idDossier === dossier.idDossier)));
            setOuvreModal({ type: 'suppression-reussie-dossier', data: dossier });
            setTimeout(() => setOuvreModal({ type: null, data: null }), 2000);
        } catch (erreur) {
            console.error('Erreur lors de la suppression du dossier :', erreur);
            setOuvreModal({ type: null, data: null }); setError(erreur.response?.data?.error || 'Erreur corbeille');
        }
    };

    const ouvrirModalSuppressionDefinitiveDossier = (dossier) => {
        setError(''); setOuvreModal({ type: 'confirmation-suppression-dossier', data: dossier }); setMenuOptionsDossier(null);
    };

    const confirmerSuppressionDefinitiveDossier = async () => {
        try {
            await axios.delete(`${API}/api/dossiers/${ouvre_modal.data.idDossier}`, { headers: authHeader() });
            setContenuDossier(prev => ({ ...prev, dossiers: prev.dossiers.filter(d => d.idDossier !== ouvre_modal.data.idDossier) }));
            setSelection(prev => prev.filter(s => !(s.type === 'dossier' && s.item.idDossier === ouvre_modal.data.idDossier)));
            setOuvreModal({ type: null, data: null });
        } catch (erreur) {
            console.error('Erreur lors de la suppression définitive du dossier :', erreur);
            setError(erreur.response?.data?.error || 'Erreur suppression définitive');
        }
    };

    const ouvrirModalViderCorbeille = () => { setError(''); setOuvreModal({ type: 'vidage-corbeille', data: null }); };

    const confirmerViderCorbeille = async () => {
        setOuvreModal({ type: null, data: null });
        setActionEnCours({ active: true, type: 'Vidage de la corbeille...', progression: 50 });
        try {
            await axios.delete(`${API}/api/corbeille/vider`, { headers: authHeader() });
            setActionEnCours({ active: true, type: 'Corbeille vidée', progression: 100 });
            setContenuDossier({ dossiers: [], fichiers: [] });
            await rafraichirVueActuelle(); 
        } catch (erreur) {
            console.error('Erreur lors du vidage de la corbeille :', erreur);
            setError(erreur.response?.data?.error || 'Erreur vidage corbeille');
        } finally {
            setTimeout(() => setActionEnCours({ active: false, type: '', progression: 0 }), 500);
        }
    };

    const restaurerDossier = async (dossier) => {
        setCreating(true); setError(''); setMenuOptionsDossier(null);
        try {
            await axios.post(`${API}/api/dossiers/${dossier.idDossier}/restaurer`, {}, { headers: authHeader() });
            setContenuDossier(prev => ({ ...prev, dossiers: prev.dossiers.filter(d => d.idDossier !== dossier.idDossier) }));
            setSelection(prev => prev.filter(s => !(s.type === 'dossier' && s.item.idDossier === dossier.idDossier)));
            await fetchData();
        } catch (erreur) {
            console.error('Erreur lors de la restauration du dossier :', erreur);
            setError(erreur.response?.data?.error || 'Erreur restauration');
        } finally { setCreating(false); }
    };

    // ===== FICHIERS =====

    const ouvrirModalRenommerFichier = (fichier) => {
        setRenommeDossier(fichier.nom);
        setError('');
        setOuvreModal({ type: 'renommage-fichier', data: fichier });
        setMenuOptionsFichier(null);
    };

    const confirmerRenommageFichier = async () => {
        const nom = nouveau_nom.trim();
        if (!nom) return setError('Nom vide invalide');
        
        const fichier = ouvre_modal.data;
        const id_actuel = dossier_actuel ? dossier_actuel.idDossier : dossier_racine?.idDossier;

        try {
            await axios.put(`${API}/api/dossiers/${id_actuel}/fichiers/${encodeURIComponent(fichier.nom)}/renommer`, 
                { nouveauNom: nom }, 
                { headers: authHeader() }
            );

            if (dossier_actuel) {
                setContenuDossier(prev => ({ 
                    ...prev, 
                    fichiers: prev.fichiers.map(f => f.nom === fichier.nom ? { ...f, nom: nom } : f) 
                }));
            } else {
                setFichiersBase(prev => prev.map(f => f.nom === fichier.nom ? { ...f, nom: nom } : f));
            }

            // Met à jour le nom si le fichier est déjà sélectionné
            setSelection(prev => prev.map(s => 
                (s.type === 'fichier' && s.item.nom === fichier.nom) ? { ...s, item: { ...s.item, nom: nom } } : s
            ));

            setOuvreModal({ type: null, data: null });
        } catch (erreur) {
            console.error('Erreur lors du renommage du fichier :', erreur);
            setError(erreur.response?.data?.error || 'Erreur lors du renommage');
        }
    };

    const telechargerFichier = async (fichier) => {
        const id_actuel = dossier_actuel ? dossier_actuel.idDossier : dossier_racine?.idDossier;
        try {
            const response = await axios.get(`${API}/api/dossiers/${id_actuel}/fichiers/${encodeURIComponent(fichier.nom)}`, { headers: authHeader(), responseType: 'blob' });
            const url = URL.createObjectURL(response.data);
            const a = document.createElement('a'); a.href = url; a.download = fichier.nom;
            document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        } catch (erreur) {
            console.error('Erreur lors du téléchargement du fichier :', erreur);
            setError('Erreur lors du téléchargement : ' + (erreur.response?.data?.error || erreur.message));
        }
    };

    const ouvrirModalSuppressionFichier = async (fichier) => {
        setError(''); setOuvreModal({ type: 'suppression-fichier', data: fichier }); setMenuOptionsFichier(null);
        const id_actuel = dossier_actuel ? dossier_actuel.idDossier : dossier_racine?.idDossier;
        try {
            await axios.delete(`${API}/api/dossiers/${id_actuel}/fichiers/${encodeURIComponent(fichier.nom)}/vers-corbeille`, { headers: authHeader() });
            if (dossier_actuel) setContenuDossier(prev => ({ ...prev, fichiers: prev.fichiers.filter(f => f.nom !== fichier.nom) }));
            else setFichiersBase(prev => prev.filter(f => f.nom !== fichier.nom));
            setSelection(prev => prev.filter(s => !(s.type === 'fichier' && s.item.nom === fichier.nom)));
            setOuvreModal({ type: 'suppression-reussie-fichier', data: fichier });
            setTimeout(() => setOuvreModal({ type: null, data: null }), 2000);
        } catch (erreur) {
            console.error('Erreur lors de la suppression du fichier :', erreur);
            setOuvreModal({ type: null, data: null }); setError('Erreur corbeille fichier');
        }
    };

    const restaurerFichier = async (fichier) => {
        try {
            await axios.post(`${API}/api/corbeille/fichiers/${encodeURIComponent(fichier.nom)}/restaurer`, {}, { headers: authHeader() });
            setContenuDossier(prev => ({ ...prev, fichiers: prev.fichiers.filter(f => f.nom !== fichier.nom) }));
            setSelection(prev => prev.filter(s => !(s.type === 'fichier' && s.item.nom === fichier.nom)));
            await fetchData(); setMenuOptionsFichier(null);
        } catch (erreur) {
            console.error('Erreur lors de la restauration du fichier :', erreur);
            setError(erreur.response?.data?.error || 'Erreur restauration fichier');
        }
    };

    const ouvrirModalSuppressionDefinitiveFichier = (fichier) => {
        setError(''); setOuvreModal({ type: 'confirmation-suppression-fichier', data: fichier }); setMenuOptionsFichier(null);
    };

    const confirmerSuppressionDefinitiveFichier = async () => {
        const fichier = ouvre_modal.data;
        const id_actuel = dossier_actuel ? dossier_actuel.idDossier : dossier_racine?.idDossier;
        try {
            await axios.delete(`${API}/api/dossiers/${id_actuel}/fichiers/${encodeURIComponent(fichier.nom)}`, { headers: authHeader() });
            if (dossier_actuel) setContenuDossier(prev => ({ ...prev, fichiers: prev.fichiers.filter(f => f.nom !== fichier.nom) }));
            else setFichiersBase(prev => prev.filter(f => f.nom !== fichier.nom));
            setSelection(prev => prev.filter(s => !(s.type === 'fichier' && s.item.nom === fichier.nom)));
            setOuvreModal({ type: null, data: null }); setError('');
        } catch (erreur) {
            console.error('Erreur lors de la suppression définitive du fichier :', erreur);
            setError(erreur.response?.data?.error || 'Erreur suppression définitive fichier');
        }
    };

    // ===== APERÇU ET DEPLACEMENT =====
    const ouvrirApercu = async (fichier) => {
        const type = obtenirTypeFichier(fichier.nom);
        if (type === 'inconnu') { setFichierPreview({ nom: fichier.nom, url: null, type: 'non_supporte' }); setError(''); return; }
        setChargementPreview(true); setError('');
        const id_actuel = dossier_actuel ? dossier_actuel.idDossier : dossier_racine?.idDossier;
        try {
            const response = await axios.get(`${API}/api/dossiers/${id_actuel}/fichiers/${encodeURIComponent(fichier.nom)}`, { headers: authHeader(), responseType: 'blob' });
            const url = URL.createObjectURL(response.data);
            setFichierPreview({ nom: fichier.nom, url, type });
        } catch (erreur) {
            console.error('Erreur lors de l\'aperçu du fichier :', erreur);
            setError(erreur.response?.data?.error || 'Erreur aperçu');
        } finally { setChargementPreview(false); }
    };

    const fermerApercu = () => {
        if (fichier_preview?.url) URL.revokeObjectURL(fichier_preview.url);
        setFichierPreview(null);
    };

    const ouvrirModalDeplacement = async (item_unique = null) => {
        const elements = item_unique ? [{ type: item_unique.cheminDaccesDossier ? 'dossier' : 'fichier', item: item_unique }] : selection;
        if (elements.length === 0) return;

        setOuvreModal({ type: 'deplacement', data: elements });
        setDossierCibleDeplacement(null); setCheminDeplacement([]); setError(''); setMenuOptionsDossier(null); setMenuOptionsFichier(null);

        try {
            if (dossier_racine) {
                const res = await axios.get(`${API}/api/dossiers/${dossier_racine.idDossier}/sous-dossiers`, { headers: authHeader() });
                setSousDossiersDeplacement(res.data || []);
            }
        } catch (erreur) {
            console.error('Erreur init déplacement :', erreur);
            setError('Erreur initi déplacement' + (erreur.response?.data?.error || erreur.message));
        }
    };

    const naviguerDeplacement = async (dossier, index = null) => {
        setDossierCibleDeplacement(dossier);
        let nouveau_chemin = dossier === null ? [] : index !== null ? chemin_deplacement.slice(0, index + 1) : [...chemin_deplacement, dossier];
        setCheminDeplacement(nouveau_chemin);
        const id_cible = dossier ? dossier.idDossier : dossier_racine?.idDossier;
        if (id_cible) {
            try {
                const res = await axios.get(`${API}/api/dossiers/${id_cible}/sous-dossiers`, { headers: authHeader() });
                setSousDossiersDeplacement(res.data || []);
            } catch (erreur) {
                console.error('Erreur navigation déplacement :', erreur);
                setError('Erreur navigation déplacement' + (erreur.response?.data?.error || erreur.message));
            }
        }
    };

    const confirmerDeplacement = async () => {
        const elements = ouvre_modal.data;
        const id_cible = dossier_cible_deplacement ? dossier_cible_deplacement.idDossier : dossier_racine?.idDossier;
        if (!id_cible) return setError("Dossier destination introuvable.");

        if (elements.some(el => el.type === 'dossier' && el.item.idDossier === id_cible)) {
            return setError("Impossible : Le dossier de destination fait partie de la sélection.");
        }

        setOuvreModal({ type: null, data: null }); setActionEnCours({ active: true, type: 'Déplacement en cours...', progression: 0 });
        const total = elements.length;
        const id_actuel = dossier_actuel ? dossier_actuel.idDossier : dossier_racine?.idDossier;

        try {
            for (let i = 0; i < total; i++) {
                const element = elements[i];
                if (element.type === 'dossier') await axios.put(`${API}/api/dossiers/${element.item.idDossier}/deplacer`, { idNouveauDossierParent: id_cible }, { headers: authHeader() });
                else await axios.put(`${API}/api/dossiers/${id_actuel}/fichiers/${encodeURIComponent(element.item.nom)}/deplacer`, { idNouveauDossierParent: id_cible }, { headers: authHeader() });
                setActionEnCours({ active: true, type: 'Déplacement...', progression: Math.round(((i + 1) / total) * 100) });
            }
            await rafraichirVueActuelle(); setSelection([]);
        } catch (erreur) {
            console.error('Erreur lors du déplacement :', erreur);
            setError(erreur.response?.data?.error || 'Erreur déplacement.');
        } finally {
            setTimeout(() => setActionEnCours({ active: false, type: '', progression: 0 }), 500);
        }
    };

    // ===== RETOURNE PROPRIETES ET METHODES =====
    return {
        // Etats principaux
        dossiers, fichiers_base, dossier_racine, corbeille_info,
        loading, error, setError, creating,
        ouvre_modal, setOuvreModal, action_en_cours, setActionEnCours,
        
        // Navigation / Dossier en cours
        dossier_actuel, contenu_dossier, fil_ariane, taille_dossiers,
        fetchData, naviguerVersUpload, gestionClicDossier, gestionClicBreadcrumb,
        
        // Modales et formulaires (CRUD)
        menu_nom_dossier, setChangeNomDossier, gestionCreeDossier,
        nouveau_nom, setRenommeDossier, ouvrirModalRenommerDossier, confirmerRenommageDossier,
        ouvrirModalSuppressionDossier, ouvrirModalSuppressionDefinitiveDossier, confirmerSuppressionDefinitiveDossier,
        restaurerDossier, ouvrirModalViderCorbeille, confirmerViderCorbeille,
        telechargerFichier, restaurerFichier, ouvrirModalSuppressionFichier, ouvrirModalSuppressionDefinitiveFichier, confirmerSuppressionDefinitiveFichier,
        ouvrirModalRenommerFichier, confirmerRenommageFichier,
        menu_options_dossier, setMenuOptionsDossier, menu_options_fichier, setMenuOptionsFichier,
        
        // Aperçu
        fichier_preview, chargement_preview, ouvrirApercu, fermerApercu,
        
        // Déplacement
        dossier_cible_deplacement, chemin_deplacement, sous_dossiers_deplacement,
        ouvrirModalDeplacement, naviguerDeplacement, confirmerDeplacement,

        // Utilitaires
        formatFileSize, tronquerNom, separerNomExtension, obtenirEmojiFichier,

        // PROPRIETES ET METHODES DES SOUS-HOOKS
        ...partage,
        ...dragDrop,
        ...rechercheTri,

        // Selection multiple
        selection,
        estSelectionne,
        toggleSelection: switchSelection,
        toggleSelectionTout,
        ...selectionActions
    };
}