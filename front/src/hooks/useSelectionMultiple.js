import { useState } from 'react';
import axios from 'axios';
import { saveAs } from 'file-saver';

const API = 'http://localhost:3000';

export function useSelectionMultiple({ authHeader, dossier_actuel, dossier_racine, fil_ariane, setOuvreModal, setActionEnCours, rafraichirVueActuelle, setError }) {
    const [selection, setSelection] = useState([]);

    const estSelectionne = (item, type) => selection.some(s => s.type === type && (type === 'dossier' ? s.item.idDossier === item.idDossier : s.item.nom === item.nom));

    const switchSelection = (item, type) => {
        if (estSelectionne(item, type)) {
            setSelection(prev => prev.filter(s => !(s.type === type && (type === 'dossier' ? s.item.idDossier === item.idDossier : s.item.nom === item.nom))));
        } else {
            setSelection(prev => [...prev, { type, item }]);
        }
    };

    const toggleSelectionTout = (dossiersAffiches, fichiersAffiches) => {
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
            console.error('Une erreur est survenue lors de la suppression de certains éléments :', erreur);
            setError('Erreur lors de la suppression : ' + (erreur.response?.data?.error || erreur.message));
        } finally {
            setTimeout(() => setActionEnCours({ active: false, type: '', progression: 0 }), 500);
        }
    };

    const telechargerElements = async (elements = selection, viderSelection = true) => {
        if (elements.length === 0) return;

        setActionEnCours({ active: true, type: 'Préparation de l\'archive par le serveur...', progression: 50 });

        try {
            const nom_racine = dossier_racine ? dossier_racine.cheminDaccesDossier : '';
            const sous_dossiers = fil_ariane.map(d => d.cheminDaccesDossier).join('/');
            const chemin_actuel = sous_dossiers ? `${nom_racine}/${sous_dossiers}` : nom_racine;
            
            const liste_fichier = elements
                .filter(s => s.type === 'fichier')
                .map(s => `${chemin_actuel}/${s.item.nom}`);
                
            const liste_dossier = elements
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
            if (viderSelection) setSelection([]);            
        } catch (erreur) {
            console.error(erreur);
            if (erreur.response && erreur.response.data instanceof Blob) {
                try {
                    const text = await erreur.response.data.text();
                    const jsonErreur = JSON.parse(text);
                    console.error('Erreur lors de la création de l\'archive :', jsonErreur);
                    setError(jsonErreur.error || "Erreur lors de la création de l'archive par le serveur.");
                } catch (e) {
                    console.error('Erreur lors de la lecture du message d\'erreur :', e);
                    setError("Erreur lors de la création de l'archive par le serveur.", e);
                }
            } else {
                console.error('Erreur lors de la création de l\'archive :', erreur);
                setError("Erreur lors de la création de l'archive par le serveur.");
            }
        } finally {
            setTimeout(() => setActionEnCours({ active: false, type: '', progression: 0 }), 1000);
        }
    };

    const telechargerSelection = async () => {
        await telechargerElements(selection, true);
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
            console.error('Une erreur est survenue lors de la restauration de certains éléments :', erreur);
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
            console.error('Une erreur est survenue lors de la suppression définitive de certains éléments :', erreur);
            setError('Une erreur est survenue lors de la suppression définitive de certains éléments.', erreur);
        } finally {
            setTimeout(() => setActionEnCours({ active: false, type: '', progression: 0 }), 500);
        }
    };

    return { 
        selection, setSelection, estSelectionne, switchSelection, toggleSelectionTout,
        ouvrirModalSuppressionMultiple, supprimerSelection, telechargerSelection, telechargerElements,
        ouvrirModalRestaurerMultiple, restaurerSelection,
        ouvrirModalSuppressionDefinitiveMultiple, supprimerDefinitivementSelection
    };
}
