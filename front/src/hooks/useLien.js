import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { obtenirTypeFichier } from '../utils/fichierUtils';

export function useLien() {
    const { token } = useParams();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [password, setPassword] = useState('');
    const [passwordRequired, setPasswordRequired] = useState(false);
    const [nomRacine, setNomRacine] = useState('');
    const [fil_ariane, setFilAriane] = useState([]); 
    
    const [fichier_preview, setFichierPreview] = useState(null);

    const fetchDetails = async (pass = password, folderId = null) => {
        setLoading(true);
        setError('');
        try {
            const config = {
                params: folderId ? { idSousDossier: folderId } : {},
                headers: pass ? { 'x-lien-password': pass } : {}
            };
            const response = await axios.get(`http://localhost:3000/api/liens/${token}/details`, config);
            
            setDetails(response.data);
            setPasswordRequired(false);
            
            if (response.data.isRacinePartage) {
                setNomRacine(response.data.nom);
            }
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setPasswordRequired(true);
                if (pass) setError('Mot de passe incorrect.');
            } else {
                setError(err.response?.data?.error || 'Erreur lors de la récupération du lien.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
        // eslint-disable-next-line
    }, [token]);

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        fetchDetails(password);
    };

    const naviguerVersDossier = (dossierId, nomDossier) => {
        setFilAriane([...fil_ariane, { id: dossierId, nom: nomDossier }]);
        fetchDetails(password, dossierId);
    };

    const gestionClicBreadcrumb = (index) => {
        if (index === -1) {
            setFilAriane([]);
            fetchDetails(password, null);
        } else {
            const nouveauFil = fil_ariane.slice(0, index + 1);
            setFilAriane(nouveauFil);
            fetchDetails(password, nouveauFil[index].id);
        }
    };

    const ouvrirApercu = (fichier) => {
        const type = obtenirTypeFichier(fichier.nom);
        if (type === 'inconnu') return;
        
        const url = `http://localhost:3000/api/liens/${token}?password=${encodeURIComponent(password)}&idDossier=${details.idDossier}&fileName=${encodeURIComponent(fichier.nom)}`;
        setFichierPreview({ nom: fichier.nom, url, type });
    };

    const telechargerFichier = (fichier) => {
        const url = `http://localhost:3000/api/liens/${token}?password=${encodeURIComponent(password)}&idDossier=${details.idDossier}&fileName=${encodeURIComponent(fichier.nom)}&download=true`;
        window.open(url, '_blank');
    };

    const telechargerDossier = (dossierId = details?.idDossier) => {
        const url = `http://localhost:3000/api/liens/${token}?password=${encodeURIComponent(password)}&idDossier=${dossierId}&download=true`;
        window.open(url, '_blank');
    };

    return {
        details, loading, error, 
        password, setPassword, passwordRequired,
        nomRacine, fil_ariane, 
        fichier_preview, setFichierPreview,
        handlePasswordSubmit, naviguerVersDossier, gestionClicBreadcrumb,
        ouvrirApercu, telechargerFichier, telechargerDossier
    };
}