import { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:3000';

export function usePartage({ authHeader, setError }) {
    const [message_partage, setMessagePartage] = useState('');
    const [cible_menu_partage, setCibleMenuPartage] = useState(null);
    const [formulaire_partage_ouvert, setFormulairePartageOuvert] = useState(false);
    const [mode_formulaire_partage, setModeFormulairePartage] = useState('utilisateur');
    const [cible_formulaire_partage, setCibleFormulairePartage] = useState(null);
    const [donnees_formulaire_partage, setDonneesFormulairePartage] = useState({ email: '', motDePasse: '', dateExpiration: '' });
    const [email_existant_partage, setEmailExistantPartage] = useState(null);
    const [chargement_partage, setChargementPartage] = useState(false);

    const verifierEmailCompte = async (email) => {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailExistantPartage(null); return false;
        }
        try {
            const reponse = await axios.get(`${API}/api/comptes/check-email`, { params: { email }, headers: authHeader() });
            const existe = reponse.data?.exists === true;
            setEmailExistantPartage(existe);
            if (existe) setDonneesFormulairePartage(prev => ({ ...prev, motDePasse: '' }));
            return existe;
        } catch (erreur) {
            console.error('Erreur lors de la récupération des données :', erreur);
            setEmailExistantPartage(null); return false;
        }
    };

    const gestionChangementEmailPartage = (email) => {
        setDonneesFormulairePartage(prev => ({ ...prev, email, motDePasse: '' }));
        setEmailExistantPartage(null);
    };

    const gestionBlurEmailPartage = async () => await verifierEmailCompte(donnees_formulaire_partage.email);

    const partagerRessource = ({ id_dossier, nom_fichier }) => {
        if (!id_dossier) { setError('Impossible de déterminer le dossier à partager.'); return; }
        setError(''); setCibleMenuPartage({ id_dossier, nom_fichier });
    };

    const ouvrirFormulairePartageUtilisateur = () => {
        setModeFormulairePartage('utilisateur'); setCibleFormulairePartage(cible_menu_partage);
        setDonneesFormulairePartage({ email: '', motDePasse: '', dateExpiration: '' });
        setEmailExistantPartage(null); setCibleMenuPartage(null); setFormulairePartageOuvert(true);
    };

    const ouvrirFormulaireGenerationLien = () => {
        setModeFormulairePartage('lien'); setCibleFormulairePartage(cible_menu_partage);
        setDonneesFormulairePartage({ email: '', motDePasse: '', dateExpiration: '' });
        setEmailExistantPartage(null); setCibleMenuPartage(null); setFormulairePartageOuvert(true);
    };

    const soumettreFormulairePartage = async (e) => {
        e.preventDefault();
        
        if (!cible_formulaire_partage?.id_dossier) {
            setError('Impossible de déterminer la ressource à partager.');
            return;
        }

        if (mode_formulaire_partage === 'lien' && !donnees_formulaire_partage.motDePasse) {
            setError('Mot de passe requis pour générer un lien.');
            return;
        }

        let email_existe = false;
        if (mode_formulaire_partage === 'utilisateur') {
            if (!donnees_formulaire_partage.email) {
                setError('Email requis pour le partage.');
                return;
            }
            email_existe = await verifierEmailCompte(donnees_formulaire_partage.email);
            if (email_existe && donnees_formulaire_partage.motDePasse) {
                setError('Le mot de passe ne peut être utilisé que pour une adresse enregistrée.');
                return;
            }
        }

        setChargementPartage(true);
        setError('');
        try {
            const corps_requete = {};
            if (mode_formulaire_partage === 'utilisateur') corps_requete.email = donnees_formulaire_partage.email;
            if (cible_formulaire_partage.nom_fichier) corps_requete.fileName = cible_formulaire_partage.nom_fichier;
            if (donnees_formulaire_partage.motDePasse) corps_requete.motDePasse = donnees_formulaire_partage.motDePasse;
            if (donnees_formulaire_partage.dateExpiration) corps_requete.dateExpiration = donnees_formulaire_partage.dateExpiration;

            const reponse = await axios.post(`${API}/api/dossiers/${cible_formulaire_partage.id_dossier}/partager`, corps_requete, { headers: authHeader() });
            const lien = reponse.data?.lien?.url;
            const message = lien ? `Lien créé : ${window.location.origin}${lien}` : 'Partage effectué avec succès.';
            setMessagePartage(message); setFormulairePartageOuvert(false);
            window.alert(message);
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors du partage.');
        } finally {
            setChargementPartage(false);
        }
    };

    const fermerMenuPartage = () => setCibleMenuPartage(null);
    const fermerFormulairePartage = () => {
        setFormulairePartageOuvert(false); setCibleFormulairePartage(null);
        setDonneesFormulairePartage({ email: '', motDePasse: '', dateExpiration: '' });
    };

    return {
        message_partage, cible_menu_partage, formulaire_partage_ouvert,
        mode_formulaire_partage, donnees_formulaire_partage, setDonneesFormulairePartage, email_existant_partage, chargement_partage,
        gestionChangementEmailPartage, gestionBlurEmailPartage, partagerRessource,
        ouvrirFormulairePartageUtilisateur, ouvrirFormulaireGenerationLien,
        fermerMenuPartage, soumettreFormulairePartage, fermerFormulairePartage
    };
}