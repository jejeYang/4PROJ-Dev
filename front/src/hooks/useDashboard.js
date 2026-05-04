import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { formatFileSize, obtenirTypeFichier, tronquerNom, separerNomExtension, obtenirEmojiFichier } from '../utils/fichierUtils';

const API = 'http://localhost:3000';

export function useDashboard() {
    const [dossiers, setDossiers] = useState([]);
    const [fichiers_base, setFichiersBase] = useState([]);
    const [dossier_racine, setDossierRacine] = useState(null);
    const [corbeille_info, setCorbeilleInfo] = useState(null);

    const [etat_survole_upload, setEtatSurvoleUpload] = useState(false);
    const [dossier_survole_upload, setDossierSurvoleUpload] = useState(null);
    const compteur_drag = useRef(0);

    const [selection, setSelection] = useState([]);
    const [action_en_cours, setActionEnCours] = useState({ active: false, type: '', progression: 0 });

    const [loading, setLoading] = useState(true);
    const [menu_nom_dossier, setChangeNomDossier] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [ouvre_modal, setOuvreModal] = useState({ type: null, data: null });
    const [nouveau_nom, setRenommeDossier] = useState('');

    const [dossier_actuel, setDossierActuel] = useState(null);
    const [contenu_dossier, setContenuDossier] = useState({ dossiers: [], fichiers: [] });
    const [fil_ariane, setFilAriane] = useState([]);

    const [taille_dossiers, setTailleDossiers] = useState({});
    const [menu_options_dossier, setMenuOptionsDossier] = useState(null);
    const [menu_options_fichier, setMenuOptionsFichier] = useState(null);
    const [fichier_preview, setFichierPreview] = useState(null);
    const [chargement_preview, setChargementPreview] = useState(false);

    const [recherche_active, setRechercheActive] = useState(false);
    const [resultats_recherche, setResultatsRecherche] = useState({ dossiers: [], fichiers: [] });
    const [chargement_recherche, setChargementRecherche] = useState(false);
    const [id_dossier_origine_recherche, setIdDossierOrigineRecherche] = useState(null);

    const [dossier_cible_deplacement, setDossierCibleDeplacement] = useState(null);
    const [chemin_deplacement, setCheminDeplacement] = useState([]);
    const [sous_dossiers_deplacement, setSousDossiersDeplacement] = useState([]);
    const navigate = useNavigate();

    const authHeader = useCallback(() => {
        const token = localStorage.getItem('token');
        return { Authorization: `Bearer ${token}` };
    }, []);

    // ===== RAFRAÎCHISSEMENT =====
    const rafraichirVueActuelle = async () => {
        await fetchData();

        if (dossier_actuel) {
            try {
                const [res_dossiers, res_fichiers] = await Promise.all([
                    axios.get(`${API}/api/dossiers/${dossier_actuel.idDossier}/sous-dossiers`, { headers: authHeader() }),
                    axios.get(`${API}/api/dossiers/${dossier_actuel.idDossier}/fichiers`, { headers: authHeader() })
                ]);
                setContenuDossier({ 
                    dossiers: res_dossiers.data || [], 
                    fichiers: res_fichiers.data || [] 
                });
            } catch (erreur) {
                console.error('Erreur lors du rafraîchissement du dossier actuel :', erreur);
            }
        }
    };

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
                const [resDossiers, resFichiers] = await Promise.all([
                    axios.get(`${API}/api/dossiers/${racine.idDossier}/sous-dossiers`, { headers: authHeader() }),
                    axios.get(`${API}/api/dossiers/${racine.idDossier}/fichiers`, { headers: authHeader() })
                ]);
                setDossiers(resDossiers.data || []);
                setFichiersBase(resFichiers.data || []);
            } else {
                setDossiers([]);
                setFichiersBase([]);
            }
        } catch (erreur) {
            console.error('Erreur lors de la récupération des données :', erreur);
            setError('Erreur lors du chargement des données.');
        } finally {
            setLoading(false);
        }
    }, [authHeader]);

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
            console.error('Erreur lors de la récupération du contenu du dossier :', erreur);
            setError("Erreur lors de l'ouverture du dossier");
        }
    };

    const gestionClicBreadcrumb = async (index) => {
        try {
            setSelection([]);
            if (recherche_active && id_dossier_origine_recherche) {
                if (id_dossier_origine_recherche !== dossier_racine?.idDossier) {
                    const nouveau_breadcrumb = index === -1 ? [] : fil_ariane.slice(0, index + 1);
                    
                    const origine_toujours_presente = nouveau_breadcrumb.some(d => d.idDossier === id_dossier_origine_recherche);
                    
                    if (!origine_toujours_presente) {
                        reinitialiserRecherche();
                    }
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
        }
    };

    const naviguerVersUpload = () => {
        navigate('/upload', { state: { dossierActuel: dossier_actuel, path: fil_ariane } });
    };

    // ===== SELECTION MULTIPLE =====
    const estSelectionne = (item, type) => {
        return selection.some(s => s.type === type && 
            (type === 'dossier' ? s.item.idDossier === item.idDossier : s.item.nom === item.nom)
        );
    };

    const switchSelection = (item, type) => {
        if (estSelectionne(item, type)) {
            setSelection(prev => prev.filter(s => !(s.type === type && 
                (type === 'dossier' ? s.item.idDossier === item.idDossier : s.item.nom === item.nom))
            ));
        } else {
            setSelection(prev => [...prev, { type, item }]);
        }
    };

    const toggleSelection = (dossiersAffiches, fichiersAffiches) => {
        const totalAffiches = dossiersAffiches.length + fichiersAffiches.length;
        if (selection.length === totalAffiches) {
            setSelection([]);
        } else {
            const nouvelleSelection = [
                ...dossiersAffiches.map(d => ({ type: 'dossier', item: d })),
                ...fichiersAffiches.map(f => ({ type: 'fichier', item: f }))
            ];
            setSelection(nouvelleSelection);
        }
    };

    const ouvrirModalSuppressionMultiple = () => {
        if (selection.length === 0) return;
        setError('');
        setOuvreModal({ type: 'confirmation-suppression-multiple', data: selection.length });
    };

    const supprimerSelection = async () => {
        if (selection.length === 0) return;
        setOuvreModal({ type: null, data: null });
        setActionEnCours({ active: true, type: 'Suppression', progression: 0 });
        const total = selection.length;
        const id_dossier_actuel = dossier_actuel ? dossier_actuel.idDossier : dossier_racine?.idDossier;

        try {
            for (let i = 0; i < total; i++) {
                const element = selection[i];
                if (element.type === 'dossier') {
                    await axios.delete(`${API}/api/dossiers/${element.item.idDossier}/vers-corbeille`, { headers: authHeader() });
                } else {
                    await axios.delete(`${API}/api/dossiers/${id_dossier_actuel}/fichiers/${encodeURIComponent(element.item.nom)}/vers-corbeille`, { headers: authHeader() });
                }
                setActionEnCours({ active: true, type: 'Suppression', progression: Math.round(((i + 1) / total) * 100) });
            }

            await rafraichirVueActuelle();
            setSelection([]);
        } catch (erreur) {
            setError('Une erreur est survenue lors de la suppression de certains éléments.', erreur);
        } finally {
            setTimeout(() => setActionEnCours({ active: false, type: '', progression: 0 }), 500);
        }
    };

    const telechargerSelection = async () => {
        if (selection.length === 0) return;

        setActionEnCours({ active: true, type: 'Préparation de l\'archive par le serveur...', progression: 50 });

        try {
            const nom_racine = dossier_racine ? dossier_racine.cheminDaccesDossier : '';
            const sous_dossiers = fil_ariane.map(d => d.cheminDaccesDossier).join('/');
            const chemin_actuel = sous_dossiers ? `${nom_racine}/${sous_dossiers}` : nom_racine;
            
            const liste_fichier = selection
                .filter(s => s.type === 'fichier')
                .map(s => `${chemin_actuel}/${s.item.nom}`);
                
            const liste_dossier = selection
                .filter(s => s.type === 'dossier')
                .map(s => `${chemin_actuel}/${s.item.cheminDaccesDossier}`);

            const params = new URLSearchParams();
            if (liste_fichier.length > 0) params.append('listeFichier', JSON.stringify(liste_fichier));
            if (liste_dossier.length > 0) params.append('listeDossier', JSON.stringify(liste_dossier));

            const response = await axios.get(`${API}/api/telechargerZip?${params.toString()}`, {
                headers: authHeader(),
                responseType: 'blob' 
            });

            let nom_archive_zip = `Archive_${new Date().getTime()}.zip`;
            const content_disposition = response.headers['content-disposition'];
            if (content_disposition) {
                const match = content_disposition.match(/filename="(.+)"/);
                if (match) nom_archive_zip = match[1];
            }

            saveAs(response.data, nom_archive_zip);

            setActionEnCours({ active: true, type: 'Téléchargement terminé !', progression: 100 });
            setSelection([]);            
        } catch (erreur) {
            console.error(erreur);
            if (erreur.response && erreur.response.data instanceof Blob) {
                try {
                    const text = await erreur.response.data.text();
                    const jsonErreur = JSON.parse(text);
                    setError(jsonErreur.error || "Erreur lors de la création de l'archive par le serveur.");
                } catch (e) {
                    setError("Erreur lors de la création de l'archive par le serveur.", e);
                }
            } else {
                setError("Erreur lors de la création de l'archive par le serveur.");
            }
        } finally {
            setTimeout(() => setActionEnCours({ active: false, type: '', progression: 0 }), 1000);
        }
    };

    const ouvrirModalRestaurerMultiple = () => {
        if (selection.length === 0) return;
        setError('');
        setOuvreModal({ type: 'confirmation-restauration-multiple', data: selection.length });
    };

    const restaurerSelection = async () => {
        if (selection.length === 0) return;
        setOuvreModal({ type: null, data: null });
        setActionEnCours({ active: true, type: 'Restauration', progression: 0 });
        const total = selection.length;

        try {
            for (let i = 0; i < total; i++) {
                const element = selection[i];
                if (element.type === 'dossier') {
                    await axios.post(`${API}/api/dossiers/${element.item.idDossier}/restaurer`, {}, { headers: authHeader() });
                } else {
                    await axios.post(`${API}/api/corbeille/fichiers/${encodeURIComponent(element.item.nom)}/restaurer`, {}, { headers: authHeader() });
                }
                setActionEnCours({ active: true, type: 'Restauration', progression: Math.round(((i + 1) / total) * 100) });
            }

            await rafraichirVueActuelle();
            setSelection([]);
        } catch (erreur) {
            setError('Une erreur est survenue lors de la restauration de certains éléments.', erreur);
        } finally {
            setTimeout(() => setActionEnCours({ active: false, type: '', progression: 0 }), 500);
        }
    };

    const ouvrirModalSuppressionDefinitiveMultiple = () => {
        if (selection.length === 0) return;
        setError('');
        setOuvreModal({ type: 'confirmation-suppression-definitive-multiple', data: selection.length });
    };

    const supprimerDefinitivementSelection = async () => {
        if (selection.length === 0) return;
        setOuvreModal({ type: null, data: null });
        setActionEnCours({ active: true, type: 'Suppression définitive', progression: 0 });
        const total = selection.length;
        const id_dossier_actuel = dossier_actuel ? dossier_actuel.idDossier : dossier_racine?.idDossier;

        try {
            for (let i = 0; i < total; i++) {
                const element = selection[i];
                if (element.type === 'dossier') {
                    await axios.delete(`${API}/api/dossiers/${element.item.idDossier}`, { headers: authHeader() });
                } else {
                    await axios.delete(`${API}/api/dossiers/${id_dossier_actuel}/fichiers/${encodeURIComponent(element.item.nom)}`, { headers: authHeader() });
                }
                setActionEnCours({ active: true, type: 'Suppression définitive', progression: Math.round(((i + 1) / total) * 100) });
            }

            await rafraichirVueActuelle();
            setSelection([]);
        } catch (erreur) {
            setError('Une erreur est survenue lors de la suppression définitive de certains éléments.', erreur);
        } finally {
            setTimeout(() => setActionEnCours({ active: false, type: '', progression: 0 }), 500);
        }
    };

    // ===== DRAG & DROP =====
    const handleDragEnterGlobal = (e) => {
        e.preventDefault(); e.stopPropagation();
        compteur_drag.current += 1;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setEtatSurvoleUpload(true);
    };

    const handleDragLeaveGlobal = (e) => {
        e.preventDefault(); e.stopPropagation();
        compteur_drag.current -= 1;
        if (compteur_drag.current === 0) setEtatSurvoleUpload(false);
    };

    const handleDragOverGlobal = (e) => { e.preventDefault(); e.stopPropagation(); };

    const handleDropGlobal = async (e, id_dossier_specifique = null) => {
        e.preventDefault(); e.stopPropagation();
        setEtatSurvoleUpload(false);
        setDossierSurvoleUpload(null);
        compteur_drag.current = 0;

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        if (files.length > 10) {
            setError('Trop de fichiers. Vous ne pouvez pas envoyer plus de 10 fichiers à la fois.');
            return;
        }

        const fichierTropGros = files.find(f => f.size > 50 * 1024 * 1024);
        if (fichierTropGros) {
            setError(`Le fichier "${fichierTropGros.name}" dépasse la taille maximale autorisée de 50 Mo.`);
            return;
        }

        const cible_id = id_dossier_specifique || (dossier_actuel ? dossier_actuel.idDossier : dossier_racine?.idDossier);
        if (!cible_id) { setError("Impossible de déterminer le dossier de destination."); return; }

        try {
            const formData = new FormData();
            files.forEach(file => formData.append('fichiers', file));
            await axios.post(`${API}/api/dossiers/${cible_id}/televerser-multiple`, formData,
                { headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' } });

            if (cible_id === dossier_actuel?.idDossier) {
                const resFichiers = await axios.get(`${API}/api/dossiers/${cible_id}/fichiers`, { headers: authHeader() });
                setContenuDossier(prev => ({ ...prev, fichiers: resFichiers.data || [] }));
            } else if (!dossier_actuel && cible_id === dossier_racine?.idDossier) {
                const resFichiersBase = await axios.get(`${API}/api/dossiers/${cible_id}/fichiers`, { headers: authHeader() });
                setFichiersBase(resFichiersBase.data || []);
            }
        } catch (erreur) {
            setError('Erreur lors de l\'upload : ' + (erreur.response?.data?.error || erreur.message));
        }
    };

    // ===== DOSSIERS =====
    const gestionCreeDossier = async (e) => {
        e.preventDefault();
        const nom_dossier = menu_nom_dossier.trim();
        if (!nom_dossier) { setError('Le nom du dossier ne peut pas être vide'); return; }

        const liste_dossiers_actuels = dossier_actuel ? contenu_dossier.dossiers : dossiers;
        if (liste_dossiers_actuels.some(d => d.cheminDaccesDossier.toLowerCase() === nom_dossier.toLowerCase())) {
            setError('Un dossier portant ce nom existe déjà à cet emplacement.');
            return;
        }

        setCreating(true); setError('');
        const id_dossier_parent = dossier_actuel ? dossier_actuel.idDossier : dossier_racine?.idDossier;

        try {
            const response = await axios.post(`${API}/api/dossiers`,
                { cheminDaccesDossier: nom_dossier, idDossierParent: id_dossier_parent },
                { headers: authHeader() });

            if (dossier_actuel) {
                setContenuDossier({ ...contenu_dossier, dossiers: [...contenu_dossier.dossiers, response.data] });
            } else {
                setDossiers([...dossiers, response.data]);
            }
            setChangeNomDossier('');
            setOuvreModal({ type: null, data: null });
        } catch (erreur) {
            setError(erreur.response?.data?.error || 'Erreur lors de la création du dossier');
        } finally {
            setCreating(false);
        }
    };

    const ouvrirModalRenommerDossier = (dossier) => {
        setRenommeDossier(dossier.cheminDaccesDossier);
        setError('');
        setOuvreModal({ type: 'renommage-dossier', data: dossier });
        setMenuOptionsDossier(null);
    };

    const confirmerRenommageDossier = async () => {
        const nouveau_nom_dossier = nouveau_nom.trim();
        if (!nouveau_nom_dossier) { setError('Le nom du dossier ne peut pas être vide'); return; }

        const liste_dossiers_actuels = dossier_actuel ? contenu_dossier.dossiers : dossiers;
        if (liste_dossiers_actuels.some(d =>
            d.cheminDaccesDossier.toLowerCase() === nouveau_nom_dossier.toLowerCase() &&
            d.idDossier !== ouvre_modal.data.idDossier)) {
            setError('Un dossier portant ce nom existe déjà à cet emplacement.');
            return;
        }
        setError('');

        try {
            const res = await axios.put(`${API}/api/dossiers/${ouvre_modal.data.idDossier}`,
                { cheminDaccesDossier: nouveau_nom_dossier }, { headers: authHeader() });

            if (dossier_actuel) {
                setContenuDossier(prev => ({ ...prev, dossiers: prev.dossiers.map(d => d.idDossier === ouvre_modal.data.idDossier ? res.data : d) }));
            } else {
                setDossiers(prev => prev.map(d => d.idDossier === ouvre_modal.data.idDossier ? res.data : d));
            }
            setOuvreModal({ type: null, data: null });
        } catch (erreur) {
            setError(erreur.response?.data?.error || 'Erreur lors du renommage');
        }
    };

    const ouvrirModalSuppressionDossier = async (dossier) => {
        setError('');
        setOuvreModal({ type: 'suppression-dossier', data: dossier });
        setMenuOptionsDossier(null);

        try {
            await axios.delete(`${API}/api/dossiers/${dossier.idDossier}/vers-corbeille`, { headers: authHeader() });

            if (dossier_actuel) {
                setContenuDossier(prev => ({ ...prev, dossiers: prev.dossiers.filter(d => d.idDossier !== dossier.idDossier) }));
            } else {
                setDossiers(prev => prev.filter(d => d.idDossier !== dossier.idDossier));
            }
            setSelection(prev => prev.filter(s => !(s.type === 'dossier' && s.item.idDossier === dossier.idDossier)));
            setOuvreModal({ type: 'suppression-reussie-dossier', data: dossier });
            setTimeout(() => setOuvreModal({ type: null, data: null }), 2000);
        } catch (erreur) {
            setOuvreModal({ type: null, data: null });
            setError(erreur.response?.data?.error || 'Erreur lors du déplacement vers la corbeille');
        }
    };

    const ouvrirModalSuppressionDefinitiveDossier = (dossier) => {
        setError('');
        setOuvreModal({ type: 'confirmation-suppression-dossier', data: dossier });
        setMenuOptionsDossier(null);
    };

    const confirmerSuppressionDefinitiveDossier = async () => {
        try {
            await axios.delete(`${API}/api/dossiers/${ouvre_modal.data.idDossier}`, { headers: authHeader() });
            setContenuDossier(prev => ({ ...prev, dossiers: prev.dossiers.filter(d => d.idDossier !== ouvre_modal.data.idDossier) }));
            setSelection(prev => prev.filter(s => !(s.type === 'dossier' && s.item.idDossier === ouvre_modal.data.idDossier)));
            setOuvreModal({ type: null, data: null });
        } catch (erreur) {
            setError(erreur.response?.data?.error || 'Erreur lors de la suppression définitive');
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
            setError(erreur.response?.data?.error || 'Erreur lors du vidage de la corbeille');
        } finally {
            setTimeout(() => setActionEnCours({ active: false, type: '', progression: 0 }), 500);
        }
    };

    const restaurerDossier = async (dossier) => {
        setCreating(true); setError('');
        setMenuOptionsDossier(null);
        try {
            await axios.post(`${API}/api/dossiers/${dossier.idDossier}/restaurer`, {}, { headers: authHeader() });
            setContenuDossier(prev => ({ ...prev, dossiers: prev.dossiers.filter(d => d.idDossier !== dossier.idDossier) }));
            setSelection(prev => prev.filter(s => !(s.type === 'dossier' && s.item.idDossier === dossier.idDossier)));
            await fetchData();
        } catch (erreur) {
            setError(erreur.response?.data?.error || 'Erreur lors de la restauration');
        } finally {
            setCreating(false);
        }
    };

    // ===== FICHIERS =====
    const telechargerFichier = async (fichier) => {
        const id_dossier_actuel = dossier_actuel ? dossier_actuel.idDossier : dossier_racine?.idDossier;
        if (!id_dossier_actuel) { setError("Erreur d'identification du dossier."); return; }

        try {
            const response = await axios.get(
                `${API}/api/dossiers/${id_dossier_actuel}/fichiers/${encodeURIComponent(fichier.nom)}`,
                { headers: authHeader(), responseType: 'blob' }
            );
            const url = URL.createObjectURL(response.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = fichier.nom;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (erreur) {
            setError('Erreur lors du téléchargement : ' + (erreur.response?.data?.error || erreur.message));
        }
    };

    const ouvrirModalSuppressionFichier = async (fichier) => {
        setError('');
        setOuvreModal({ type: 'suppression-fichier', data: fichier });
        setMenuOptionsFichier(null);
        
        const id_dossier_actuel = dossier_actuel ? dossier_actuel.idDossier : dossier_racine?.idDossier;

        try {
            await axios.delete(
                `${API}/api/dossiers/${id_dossier_actuel}/fichiers/${encodeURIComponent(fichier.nom)}/vers-corbeille`,
                { headers: authHeader() }
            );
            if (dossier_actuel) {
                setContenuDossier(prev => ({ ...prev, fichiers: prev.fichiers.filter(f => f.nom !== fichier.nom) }));
            } else {
                setFichiersBase(prev => prev.filter(f => f.nom !== fichier.nom));
            }
            setSelection(prev => prev.filter(s => !(s.type === 'fichier' && s.item.nom === fichier.nom)));
            setOuvreModal({ type: 'suppression-reussie-fichier', data: fichier });
            setTimeout(() => setOuvreModal({ type: null, data: null }), 2000);
        } catch (erreur) {
            setOuvreModal({ type: null, data: null });
            setError(erreur.response?.data?.error || 'Erreur lors du déplacement du fichier vers la corbeille');
        }
    };

    const restaurerFichier = async (fichier) => {
        try {
            await axios.post(
                `${API}/api/corbeille/fichiers/${encodeURIComponent(fichier.nom)}/restaurer`,
                {}, { headers: authHeader() }
            );
            setContenuDossier(prev => ({ ...prev, fichiers: prev.fichiers.filter(f => f.nom !== fichier.nom) }));
            setSelection(prev => prev.filter(s => !(s.type === 'fichier' && s.item.nom === fichier.nom)));
            await fetchData();
            setMenuOptionsFichier(null);
        } catch (erreur) {
            setError(erreur.response?.data?.error || 'Erreur lors de la restauration du fichier');
        }
    };

    const ouvrirModalSuppressionDefinitiveFichier = (fichier) => {
        setError('');
        setOuvreModal({ type: 'confirmation-suppression-fichier', data: fichier });
        setMenuOptionsFichier(null);
    };

    const confirmerSuppressionDefinitiveFichier = async () => {
        const fichier = ouvre_modal.data;
        const id_dossier_actuel = dossier_actuel ? dossier_actuel.idDossier : dossier_racine?.idDossier;

        try {
            await axios.delete(
                `${API}/api/dossiers/${id_dossier_actuel}/fichiers/${encodeURIComponent(fichier.nom)}`,
                { headers: authHeader() }
            );
            if (dossier_actuel) {
                setContenuDossier(prev => ({ ...prev, fichiers: prev.fichiers.filter(f => f.nom !== fichier.nom) }));
            } else {
                setFichiersBase(prev => prev.filter(f => f.nom !== fichier.nom));
            }
            setSelection(prev => prev.filter(s => !(s.type === 'fichier' && s.item.nom === fichier.nom)));
            setOuvreModal({ type: null, data: null });
            setError('');
        } catch (erreur) {
            setError(erreur.response?.data?.error || 'Erreur lors de la suppression de fichier');
        }
    };

    // ===== APERÇU =====
    const ouvrirApercu = async (fichier) => {
        const type = obtenirTypeFichier(fichier.nom);
        if (type === 'inconnu') {
            setFichierPreview({ nom: fichier.nom, url: null, type: 'non_supporte' });
            setError('');
            return;
        }

        setChargementPreview(true); setError('');
        const id_dossier_actuel = dossier_actuel ? dossier_actuel.idDossier : dossier_racine?.idDossier;

        try {
            const response = await axios.get(
                `${API}/api/dossiers/${id_dossier_actuel}/fichiers/${encodeURIComponent(fichier.nom)}`,
                { headers: authHeader(), responseType: 'blob' }
            );
            const url = URL.createObjectURL(response.data);
            setFichierPreview({ nom: fichier.nom, url, type });
        } catch (erreur) {
            setError(erreur.response?.data?.error || "Erreur lors du chargement de l'aperçu du fichier.");
        } finally {
            setChargementPreview(false);
        }
    };

    const fermerApercu = () => {
        if (fichier_preview?.url) URL.revokeObjectURL(fichier_preview.url);
        setFichierPreview(null);
    };

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

    // ===== DEPLACEMENT =====
    const ouvrirModalDeplacement = async (item_unique = null) => {
        const elements = item_unique 
            ? [{ type: item_unique.cheminDaccesDossier ? 'dossier' : 'fichier', item: item_unique }] 
            : selection;
            
        if (elements.length === 0) return;

        setOuvreModal({ type: 'deplacement', data: elements });
        setDossierCibleDeplacement(null);
        setCheminDeplacement([]);
        setError('');
        setMenuOptionsDossier(null);
        setMenuOptionsFichier(null);

        try {
            if (dossier_racine) {
                const res = await axios.get(`${API}/api/dossiers/${dossier_racine.idDossier}/sous-dossiers`, { headers: authHeader() });
                setSousDossiersDeplacement(res.data || []);
            }
        } catch (erreur) {
            console.error('Erreur initialisation déplacement:', erreur);
        }
    };

    const naviguerDeplacement = async (dossier, index = null) => {
        setDossierCibleDeplacement(dossier);
        
        let nouveau_chemin = [];
        if (dossier === null) {
            nouveau_chemin = [];
        } else if (index !== null) {
            nouveau_chemin = chemin_deplacement.slice(0, index + 1);
        } else {
            nouveau_chemin = [...chemin_deplacement, dossier];
        }
        setCheminDeplacement(nouveau_chemin);

        const id_cible = dossier ? dossier.idDossier : dossier_racine?.idDossier;
        if (id_cible) {
            try {
                const res = await axios.get(`${API}/api/dossiers/${id_cible}/sous-dossiers`, { headers: authHeader() });
                setSousDossiersDeplacement(res.data || []);
            } catch (erreur) {
                console.error('Erreur chargement sous-dossiers:', erreur);
            }
        }
    };

    const confirmerDeplacement = async () => {
        const elements = ouvre_modal.data;
        const id_cible = dossier_cible_deplacement ? dossier_cible_deplacement.idDossier : dossier_racine?.idDossier;

        if (!id_cible) { setError("Dossier de destination introuvable."); return; }

        const cibleDansSelection = elements.some(el => el.type === 'dossier' && el.item.idDossier === id_cible);
        if (cibleDansSelection) {
            setError("Impossible : Le dossier de destination fait partie de votre sélection.");
            return;
        }

        setOuvreModal({ type: null, data: null });
        setActionEnCours({ active: true, type: 'Déplacement en cours...', progression: 0 });
        const total = elements.length;
        const id_dossier_actuel = dossier_actuel ? dossier_actuel.idDossier : dossier_racine?.idDossier;

        try {
            for (let i = 0; i < total; i++) {
                const element = elements[i];
                //TODO: remplacer par vraies routes backend
                if (element.type === 'dossier') {
                    await axios.put(`${API}/api/dossiers/${element.item.idDossier}/deplacer`, 
                        { idNouveauDossierParent: id_cible }, { headers: authHeader() });
                } else {
                    await axios.put(`${API}/api/dossiers/${id_dossier_actuel}/fichiers/${encodeURIComponent(element.item.nom)}/deplacer`, 
                        { idNouveauDossierParent: id_cible }, { headers: authHeader() });
                }
                setActionEnCours({ active: true, type: 'Déplacement...', progression: Math.round(((i + 1) / total) * 100) });
            }
            await rafraichirVueActuelle();
            setSelection([]);
        } catch (erreur) {
            setError(erreur.response?.data?.error || 'Erreur lors du déplacement.');
        } finally {
            setTimeout(() => setActionEnCours({ active: false, type: '', progression: 0 }), 500);
        }
    };

    return {
        // etats
        dossiers, fichiers_base, dossier_racine, corbeille_info,
        etat_survole_upload, dossier_survole_upload, setDossierSurvoleUpload,
        selection, estSelectionne, toggleSelection: switchSelection, toggleSelectionTout: toggleSelection, 
        ouvrirModalSuppressionMultiple, supprimerSelection, telechargerSelection, action_en_cours,
        ouvrirModalRestaurerMultiple, restaurerSelection,
        ouvrirModalSuppressionDefinitiveMultiple, supprimerDefinitivementSelection,
        loading, menu_nom_dossier, setChangeNomDossier, creating, error, setError,
        ouvre_modal, setOuvreModal, nouveau_nom, setRenommeDossier,
        dossier_actuel, contenu_dossier, fil_ariane,
        taille_dossiers, menu_options_dossier, setMenuOptionsDossier,
        menu_options_fichier, setMenuOptionsFichier,
        fichier_preview, chargement_preview,
        dossier_cible_deplacement, chemin_deplacement, sous_dossiers_deplacement,
        // actions
        fetchData, naviguerVersUpload,
        handleDragEnterGlobal, handleDragLeaveGlobal, handleDragOverGlobal, handleDropGlobal,
        gestionClicDossier, gestionClicBreadcrumb,
        gestionCreeDossier, 
        ouvrirModalRenommerDossier, confirmerRenommageDossier,
        ouvrirModalSuppressionDossier, ouvrirModalSuppressionDefinitiveDossier, confirmerSuppressionDefinitiveDossier,
        restaurerDossier,
        ouvrirModalViderCorbeille, confirmerViderCorbeille,
        telechargerFichier, restaurerFichier, 
        ouvrirModalSuppressionFichier, ouvrirModalSuppressionDefinitiveFichier, confirmerSuppressionDefinitiveFichier,
        ouvrirApercu, fermerApercu,
        lancerRecherche, reinitialiserRecherche,
        recherche_active, resultats_recherche, chargement_recherche,
        ouvrirModalDeplacement, naviguerDeplacement, confirmerDeplacement,
        formatFileSize, tronquerNom, separerNomExtension, obtenirEmojiFichier
    };
}