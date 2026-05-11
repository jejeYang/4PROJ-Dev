import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:3000';

export function useVoirPartage() {
    const navigate = useNavigate();
    const [liensPartage, setLiensPartage] = useState([]);
    const [chargementEnCours, setChargementEnCours] = useState(true);
    const [erreur, setErreur] = useState('');

    const authHeader = useCallback(() => {
        const token = localStorage.getItem('token');
        return { Authorization: `Bearer ${token}` };
    }, []);

    const chargerPartages = useCallback(async () => {
        setChargementEnCours(true);
        setErreur('');
        try {
            // Liste les liens de partage pour l'utilisateur connecté
            const response = await axios.get(`${API}/api/liens`, { headers: authHeader() });
            setLiensPartage(response.data || []);
        } catch (err) {
            console.error("Erreur lors du chargement des partages :", err);
            setErreur(err.response?.data?.error || "Impossible de charger vos partages.");
        } finally {
            setChargementEnCours(false);
        }
    }, [authHeader]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        chargerPartages();
    }, [chargerPartages, navigate]);

    const supprimerLien = async (idLien) => {
        if (!window.confirm("Voulez-vous vraiment supprimer ce lien de partage ? Il ne sera plus accessible.")) {
            return;
        }
        
        try {
            // TODO: créer une route API pour supprimer un lien de partage
            await axios.delete(`${API}/api/liens/${idLien}`, { headers: authHeader() });
            
            // Mise à jour de l'affichage
            setLiensPartage(prevLiens => prevLiens.filter(lien => lien.idLien !== idLien));
        } catch (err) {
            console.error("Erreur lors de la suppression :", err);
            setErreur(err.response?.data?.error || "Erreur lors de la suppression du lien.");
        }
    };

    return {
        liensPartage,
        chargementEnCours,
        erreur,
        setErreur,
        supprimerLien
    };
}