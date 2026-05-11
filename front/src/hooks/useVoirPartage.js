import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = 'http://localhost:3000';

export function useVoirPartage() {
    const [liensPublics, setLiensPublics] = useState([]);
    const [partagesEnvoyes, setPartagesEnvoyes] = useState([]);
    const [partagesRecus, setPartagesRecus] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState('');

    const fetchAllPartages = useCallback(async () => {
        setChargement(true);
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        try {
            const [resLiens, resEnvoyes, resRecus] = await Promise.all([
                axios.get(`${API}/api/partage/mes-liens`, config),
                axios.get(`${API}/api/partage/envoyes`, config),
                axios.get(`${API}/api/partage/recus`, config)
            ]);
            setLiensPublics(resLiens.data);
            setPartagesEnvoyes(resEnvoyes.data);
            setPartagesRecus(resRecus.data);
        } catch (erreur) {
            setErreur("Erreur lors de la récupération des partages." + (erreur.response?.data?.error || erreur.message));
        } finally {
            setChargement(false);
        }
    }, []);

    useEffect(() => { fetchAllPartages(); }, [fetchAllPartages]);

    const supprimerLienPublic = async (idLien) => {
        try {
            await axios.delete(`${API}/api/partage/lien/${idLien}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setLiensPublics(prev => prev.filter(l => l.idLien !== idLien));
        } catch (erreur) {
            setErreur("Impossible de supprimer le lien." + (erreur.response?.data?.error || erreur.message));
        }
    };

    const resilierPartageInterne = async (idDossier) => {
        if (!window.confirm("Cela supprimera l'accès pour tous les participants. Confirmer ?")) return;
        try {
            await axios.delete(`${API}/api/partage/interne/${idDossier}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            fetchAllPartages();
        } catch (erreur) {
            setErreur("Erreur lors de la révocation du partage." + (erreur.response?.data?.error || erreur.message));
        }
    };

    return { 
        liensPublics, partagesEnvoyes, partagesRecus, 
        chargement, erreur, setErreur, 
        supprimerLienPublic, resilierPartageInterne 
    };
}