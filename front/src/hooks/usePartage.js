import { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:3000';

export function usePartage({ setError, setActionEnCours, rafraichirVueActuelle }) {
    const [formulaire_partage_ouvert, setFormulairePartageOuvert] = useState(false);
    const [mode_formulaire_partage, setModeFormulairePartage] = useState('utilisateur');
    const [cible_formulaire_partage, setCibleFormulairePartage] = useState(null);
    const [donnees_formulaire_partage, setDonneesFormulairePartage] = useState({ email: '', motDePasse: '', dateExpiration: '' });

    const partagerRessource = ({ id_dossier, nom_fichier }) => {
        if (!id_dossier) return setError('Impossible de déterminer la ressource.');
        setError('');
        setCibleFormulairePartage({ dossierId: id_dossier, fileName: nom_fichier });
        
        // Par défaut, si c'est un fichier, on force le mode "Lien" car le partage interne est restreint aux dossiers
        if (nom_fichier) {
            setModeFormulairePartage('lien');
        } else {
            setModeFormulairePartage('utilisateur');
        }
        
        setDonneesFormulairePartage({ email: '', motDePasse: '', dateExpiration: '' });
        setFormulairePartageOuvert(true);
    };

    const soumettreFormulairePartage = async (e) => {
        e.preventDefault();
        setActionEnCours({ active: true, type: 'Partage en cours...', progression: 0 });
        setError('');

        try {
            const token = localStorage.getItem('token');
            const { dossierId, fileName } = cible_formulaire_partage;
            let url = '';
            let body = {};

            if (mode_formulaire_partage === 'utilisateur') {
                url = `${API}/api/partage/utilisateur/${dossierId}`;
                body = { email: donnees_formulaire_partage.email };
            } else {
                url = `${API}/api/partage/lien/${dossierId}`;
                body = { 
                    motDePasse: donnees_formulaire_partage.motDePasse,
                    dateExpiration: donnees_formulaire_partage.dateExpiration,
                    fileName: fileName // Peut être null si c'est un dossier
                };
            }

            const response = await axios.post(url, body, { 
                headers: { Authorization: `Bearer ${token}` }
            });

            // Si c'est un lien public, on le copie dans le presse-papier
            if (mode_formulaire_partage === 'lien' && response.data.token) {
                const urlComplete = `${window.location.origin}/liens/${response.data.token}`;
                await navigator.clipboard.writeText(urlComplete);
                alert("Lien copié dans le presse-papier !");
            }

            setFormulairePartageOuvert(false);
            if (rafraichirVueActuelle) rafraichirVueActuelle();
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors du partage.');
        } finally {
            setActionEnCours({ active: false, type: '', progression: 0 });
        }
    };

    const fermerFormulairePartage = () => {
        setFormulairePartageOuvert(false);
        setCibleFormulairePartage(null);
    };

    return {
        formulaire_partage_ouvert, mode_formulaire_partage, setModeFormulairePartage,
        donnees_formulaire_partage, setDonneesFormulairePartage,
        partagerRessource, soumettreFormulairePartage, fermerFormulairePartage
    };
}