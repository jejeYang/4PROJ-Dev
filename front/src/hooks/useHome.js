import { useState, useEffect } from 'react';
import { obtenirTypeFichier } from '../utils/fichierUtils';

export const useHome = () => {
    const estAuthentifie = !!localStorage.getItem('token');
    
    let nomUtilisateur = 'Utilisateur';
    if (estAuthentifie) {
        const utilisateur = localStorage.getItem('user');
        if (utilisateur) {
            try {
                const donnees_utilisateur = JSON.parse(utilisateur);
                nomUtilisateur = donnees_utilisateur.nom || donnees_utilisateur.email || 'Utilisateur';
            } catch {
                nomUtilisateur = 'Utilisateur';
            }
        }
    }

    const [stats, setStats] = useState(null);
    const [chargement, setChargement] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!estAuthentifie) {
                setChargement(false);
                setStats(null); 
                return;
            }

            setChargement(true);
            try {
                const response = await fetch('http://localhost:3000/api/dossiers/stats/home', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                
                if (response.ok) {
                    const data = await response.json();

                    // Calcul de la répartition des types de fichiers
                    const compteTypes = {};
                    data.tousLesFichiers.forEach(nomFichier => {
                        const type = obtenirTypeFichier(nomFichier);
                        compteTypes[type] = (compteTypes[type] || 0) + 1;
                    });
                    
                    const donneesTypesGraphique = Object.keys(compteTypes).map(cle => ({
                        name: cle,
                        value: compteTypes[cle]
                    }));

                    setStats({ ...data, typesFichiers: donneesTypesGraphique });
                }
            } catch (error) {
                console.error("Erreur lors de la récupération des statistiques :", error);
            } finally {
                setChargement(false);
            }
        };

        fetchStats();
    }, [estAuthentifie]);

    const formatOctets = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return { estAuthentifie, nomUtilisateur, stats, chargement, formatOctets };
};