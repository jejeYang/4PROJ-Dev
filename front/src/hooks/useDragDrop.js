import { useState, useRef } from 'react';
import axios from 'axios';

const API = 'http://localhost:3000';

export function useDragDrop({ authHeader, dossier_actuel, dossier_racine, setError, setContenuDossier, setFichiersBase, setTailleDossiers }) {
    const [etat_survole_upload, setEtatSurvoleUpload] = useState(false);
    const [dossier_survole_upload, setDossierSurvoleUpload] = useState(null);
    const compteur_drag = useRef(0);

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
        setEtatSurvoleUpload(false); setDossierSurvoleUpload(null); compteur_drag.current = 0;

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;
        if (files.length > 10) return setError('Trop de fichiers (max 10).');
        if (files.find(f => f.size > 50 * 1024 * 1024)) return setError('Un fichier dépasse 50 Mo.');

        const cible_id = id_dossier_specifique || (dossier_actuel ? dossier_actuel.idDossier : dossier_racine?.idDossier);
        if (!cible_id) return setError("Dossier de destination introuvable.");

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

            try {
                const resTaille = await axios.get(`${API}/api/dossiers/${cible_id}/taille`, { headers: authHeader() });
                setTailleDossiers(prev => ({ ...prev, [cible_id]: resTaille.data.taille || 0 }));
            } catch (erreur) {                
                console.error("Erreur lors de la récupération de la nouvelle taille :", erreur);
                setError('Erreur lors de la récupération de la nouvelle taille.' + (erreur.response?.data?.error || erreur.message));
            }

        } catch (erreur) {
            console.error('Erreur lors de l\'upload :', erreur);
            setError('Erreur lors de l\'upload : ' + (erreur.response?.data?.error || erreur.message));
        }
    };

    return { etat_survole_upload, dossier_survole_upload, setDossierSurvoleUpload, handleDragEnterGlobal, handleDragLeaveGlobal, handleDragOverGlobal, handleDropGlobal };
}