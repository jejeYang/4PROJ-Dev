import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

export function useUpload() {
    const url_localisation = useLocation();
    const [glisser_actif, setGlisserActif] = useState(false);
    const [fichiers, setFichiers] = useState([]);
    const [en_cours_de_televersement, setEnCoursDeTeleversement] = useState(false);
    const [barre_de_progression, setBarreProgression] = useState(0); 
    const [upload_reussi, setUploadReussi] = useState(false);
    
    const [dossier_actuel, setDossierActuel] = useState(url_localisation.state?.dossierActuel || null);
    const [dossier_racine, setDossierRacine] = useState(null);
    const [chemin_acces, setCheminAcces] = useState(url_localisation.state?.path || []);
    const [sous_dossiers_affiches, setSousDossiersAffiches] = useState([]);
    const [erreur_upload, setErreurUpload] = useState('');

    useEffect(() => {
        const recupererDossiers = async () => {
            try {
                const token = localStorage.getItem('token');
                const utilisateur = JSON.parse(localStorage.getItem('user'));
                
                const cible_id = dossier_actuel ? (dossier_actuel.idDossier || dossier_actuel) : null;

                if (cible_id) {
                    const reponse = await axios.get(`http://localhost:3000/api/dossiers/${cible_id}/sous-dossiers`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setSousDossiersAffiches(reponse.data || []);
                } else {
                    const reponse_racine = await axios.get(`http://localhost:3000/api/comptes/${utilisateur.id}/dossiers`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    const d_racine = (reponse_racine.data || []).find(d => d.cheminDaccesDossier === `user_${utilisateur.id}`);
                    
                    if (d_racine) {
                        setDossierRacine(d_racine);
                        const reponse_sous = await axios.get(`http://localhost:3000/api/dossiers/${d_racine.idDossier}/sous-dossiers`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setSousDossiersAffiches(reponse_sous.data || []);
                    }
                }
            } catch (err) {
                console.error("Erreur récupération dossiers:", err);
            }
        };
        recupererDossiers();
    }, [dossier_actuel]);

    const gestionGlisserEntrer = (e) => {
        e.preventDefault();
        setGlisserActif(true);
    };

    const gestionGlisserQuitter = (e) => {
        e.preventDefault();
        setGlisserActif(false);
    };

    const gestionDepot = (e) => {
        e.preventDefault();
        setGlisserActif(false);
        setUploadReussi(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFichiers(Array.from(e.dataTransfer.files));
        }
    };

    const gestionChangementFichier = (e) => {
        setUploadReussi(false);
        if (e.target.files && e.target.files.length > 0) {
            setFichiers(Array.from(e.target.files));
        }
    };

    const supprimerFichierSelectionne = (index) => {
        setFichiers(fichiers.filter((_, i) => i !== index));
    };

    const gestionSoumission = async (e) => {
        e.preventDefault();
        if (fichiers.length === 0) return;

        const cible_id = dossier_actuel ? (dossier_actuel.idDossier || dossier_actuel) : dossier_racine?.idDossier;

        if (!cible_id) {
            setErreurUpload('Impossible d\'identifier le dossier de destination.');
            return;
        }

        setEnCoursDeTeleversement(true);
        setBarreProgression(0);
        setErreurUpload('');
        setUploadReussi(false);

        const donneesTransfert = new FormData();
        fichiers.forEach((f) => donneesTransfert.append('fichiers', f));

        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:3000/api/dossiers/${cible_id}/televerser-multiple`, donneesTransfert, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                },
                onUploadProgress: (evenement) => {
                    const pourcentage = Math.round((evenement.loaded * 100) / evenement.total);
                    setBarreProgression(pourcentage);
                }
            });

            setUploadReussi(true);
            setFichiers([]);
            setTimeout(() => setUploadReussi(false), 4000);
        } catch (erreur) {
            setErreurUpload(erreur.response?.data?.error || erreur.response?.data?.message || 'Une erreur est survenue lors du téléversement');
        } finally {
            setEnCoursDeTeleversement(false);
        }
    };

    const naviguerDossier = (dossier) => {
        setUploadReussi(false);
        if (dossier === null) {
            setDossierActuel(null);
            setCheminAcces([]);
        } else {
            setDossierActuel(dossier);
            const indexExistant = chemin_acces.findIndex(d => d.idDossier === dossier.idDossier);
            if (indexExistant !== -1) {
                setCheminAcces(chemin_acces.slice(0, indexExistant + 1));
            } else {
                setCheminAcces([...chemin_acces, dossier]);
            }
        }
    };

    return {
        glisser_actif,
        fichiers,
        en_cours_de_televersement,
        barre_de_progression,
        upload_reussi,
        chemin_acces,
        sous_dossiers_affiches,
        erreur_upload,
        gestionGlisserEntrer,
        gestionGlisserQuitter,
        gestionDepot,
        gestionChangementFichier,
        supprimerFichierSelectionne,
        gestionSoumission,
        naviguerDossier
    };
}