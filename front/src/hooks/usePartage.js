import { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:3000';

export function usePartage({ setError }) {
    const [message_partage, setMessagePartage] = useState('');
    const [cible_menu_partage] = useState(null);
    const [formulaire_partage_ouvert, setFormulairePartageOuvert] = useState(false);
    const [mode_formulaire_partage, setModeFormulairePartage] = useState('utilisateur');
    const [cible_formulaire_partage, setCibleFormulairePartage] = useState(null);
    const [donnees_formulaire_partage, setDonneesFormulairePartage] = useState({ email: '', motDePasse: '', dateExpiration: '' });
    const [email_existant_partage, setEmailExistantPartage] = useState(null);
    const [chargement_partage, setChargementPartage] = useState(false);

    const verifierEmailCompte = async (email) => {
        if (!email) {
            setEmailExistantPartage(null);
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailExistantPartage(null);
            return false;
        }

        try {
            const response = await axios.get('http://localhost:3000/api/comptes/check-email', {
                params: { email }
            });

            const exists = response.data?.exists === true;
            setEmailExistantPartage(exists);

            if (exists) {
                setDonneesFormulairePartage(prev => ({
                    ...prev,
                    motDePasse: ''
                }));
            }

            return exists;
        } catch (erreur) {
            console.error('Erreur lors de la vérification de l’email :', erreur);
            setError('Erreur lors de la vérification de l’email : ' + (erreur.response?.data?.error || erreur.message));
            setEmailExistantPartage(null);
            return false;
        }
    };

    const gestionChangementEmailPartage = (email) => {
        setDonneesFormulairePartage(prev => ({
            ...prev,
            email,
            motDePasse: ''
        }));
        setEmailExistantPartage(null);
    };

    const gestionBlurEmailPartage = async () => {
        await verifierEmailCompte(donnees_formulaire_partage.email);
    }

    const partagerRessource = ({ id_dossier, nom_fichier }) => {
        if (!id_dossier) {
            setError('Impossible de déterminer le dossier à partager.');
            return;
        }
        setError('');
        setCibleFormulairePartage({ dossierId: id_dossier, fileName: nom_fichier });
        setModeFormulairePartage('utilisateur');
        setDonneesFormulairePartage({ email: '', motDePasse: '', dateExpiration: '' });
        setEmailExistantPartage(null);
        setFormulairePartageOuvert(true);
    };

    const soumettreFormulairePartage = async (e) => {
        e.preventDefault();

        if (!cible_formulaire_partage?.dossierId) {
            setError('Impossible de déterminer la ressource à partager.');
            return;
        }

        if (mode_formulaire_partage === 'lien' && !donnees_formulaire_partage.motDePasse) {
            setError('Mot de passe requis pour générer un lien.');
            return;
        }

        let emailExists = false;

        if (mode_formulaire_partage === 'utilisateur') {
            if (!donnees_formulaire_partage.email) {
                setError('Email requis pour le partage.');
                return;
            }

            emailExists = await verifierEmailCompte(donnees_formulaire_partage.email);

            if (emailExists && donnees_formulaire_partage.motDePasse) {
                setError('Le mot de passe ne peut être utilisé que pour une adresse enregistrée.');
                return;
            }
        }

        setChargementPartage(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const body = {};

            if (mode_formulaire_partage === 'utilisateur') {
                body.email = donnees_formulaire_partage.email;
            }

            if (cible_formulaire_partage.fileName) {
                body.fileName = cible_formulaire_partage.fileName;
            }

            if (donnees_formulaire_partage.motDePasse) {
                body.motDePasse = donnees_formulaire_partage.motDePasse;
            }

            if (donnees_formulaire_partage.dateExpiration) {
                body.dateExpiration = donnees_formulaire_partage.dateExpiration;
            }

            const response = await axios.post(
                `http://localhost:3000/api/dossiers/${cible_formulaire_partage.dossierId}/partager`,
                body,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            let message = response.data?.message || 'Partage effectué avec succès.';
            const lien = response.data?.lien?.url;
            
            if (mode_formulaire_partage === 'lien' && lien && !response.data?.sharedWithAccount) {
                const urlComplete = `${window.location.origin}${lien}`;
                message = `Lien copié dans le presse-papiers : ${urlComplete}`;
                try {
                    await navigator.clipboard.writeText(urlComplete);
                } catch (erreur) {
                    console.error('Erreur de copie :', erreur);
                    setError('Erreur lors de la copie du lien : ' + (erreur.response?.data?.error || erreur.message));
                    message = `Lien de partage généré : ${urlComplete}`;
                }
            }

            setMessagePartage(message);
            setFormulairePartageOuvert(false);
            setModeFormulairePartage('utilisateur');
            setCibleFormulairePartage(null);
            window.alert(message);
        } catch (erreur) {
            console.error('Erreur lors du partage :', erreur);
            setError('Erreur lors du partage : ' + (erreur.response?.data?.error || erreur.message));
        } finally {
            setChargementPartage(false);
        }
    };


    const fermerFormulairePartage = () => {
        setFormulairePartageOuvert(false);
        setModeFormulairePartage('utilisateur');
        setCibleFormulairePartage(null);
        setDonneesFormulairePartage({
            email: '',
            motDePasse: '',
            dateExpiration: ''
        });
        setEmailExistantPartage(null);
    };

    return {
        message_partage, cible_menu_partage, formulaire_partage_ouvert,
        mode_formulaire_partage, setModeFormulairePartage, donnees_formulaire_partage, setDonneesFormulairePartage, chargement_partage,
        gestionChangementEmailPartage, gestionBlurEmailPartage, partagerRessource,
        soumettreFormulairePartage, fermerFormulairePartage
    };
}