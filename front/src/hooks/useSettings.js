import { useState, useRef } from 'react';
import axios from 'axios';

export function useSettings() {
    const fileInputRef = useRef(null);
    const [nouvelleImagePreview, setNouvelleImagePreview] = useState(null);
    const [fichierImage, setFichierImage] = useState(null);
    const [erreurImage, setErreurImage] = useState(false);
    const [afficherModalSuppression, setAfficherModalSuppression] = useState(false);
    const [motDePasseSuppression, setMotDePasseSuppression] = useState('');

    const [utilisateur, setUtilisateur] = useState(() => {
        const donnees_sauvegardees = localStorage.getItem('user');
        return donnees_sauvegardees ? JSON.parse(donnees_sauvegardees) : null;
    });

    const [donnees_formulaire, setDonneesFormulaire] = useState(() => {
        const donnees_sauvegardees = localStorage.getItem('user');
        if (donnees_sauvegardees) {
            const parsed = JSON.parse(donnees_sauvegardees);
            return { nom: parsed.nom, email: parsed.email };
        }
        return { nom: '', email: '' };
    });

    const [donnees_mot_de_passe, setDonneesMotDePasse] = useState({ 
        ancien_mot_de_passe: '', 
        nouveau_mot_de_passe: '', 
        confirmer_mot_de_passe: '' 
    });
    
    const [message_notification, setMessageNotification] = useState('');

    const urlAvatarBackend = utilisateur ? `http://localhost:3000/api/users/avatar/${utilisateur.id || utilisateur.idCompte || utilisateur.idUtilisateur}` : null;

    const gestionChangementProfil = (e) => {
        setDonneesFormulaire({ ...donnees_formulaire, [e.target.name]: e.target.value });
    };

    const gestionChangementMotDePasse = (e) => {
        setDonneesMotDePasse({ ...donnees_mot_de_passe, [e.target.name]: e.target.value });
    };

    const declencherSelectionFichier = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const gestionChangementImage = (e) => {
        const fichier = e.target.files[0];
        if (fichier) {
            setFichierImage(fichier);
            const reader = new FileReader();
            reader.onloadend = () => {
                setNouvelleImagePreview(reader.result);
                setErreurImage(false);
            };
            reader.readAsDataURL(fichier);
        }
    };

    const mettreAJourProfil = async (e) => {
        e.preventDefault();
        try {
            const jeton_authentification = localStorage.getItem('token');
            const headersBase = { Authorization: `Bearer ${jeton_authentification}` };
            
            const reponseTexte = await axios.put(
                `http://localhost:3000/api/users/${utilisateur.id || utilisateur.idCompte || utilisateur.idUtilisateur}`,
                {
                    nom: donnees_formulaire.nom,
                    email: donnees_formulaire.email
                },
                { headers: headersBase }
            );

            let utilisateur_mis_a_jour = { 
                ...utilisateur, 
                ...(reponseTexte.data.utilisateur || {}),
                nom: donnees_formulaire.nom,
                email: donnees_formulaire.email
            };

            if (fichierImage) {
                const formData = new FormData();
                formData.append('avatar', fichierImage); 

                await axios.post(
                    'http://localhost:3000/api/users/avatar', 
                    formData,
                    { 
                        headers: { 
                            ...headersBase,
                            'Content-Type': 'multipart/form-data' 
                        } 
                    }
                );
                
                utilisateur_mis_a_jour.avatarUrl = `${urlAvatarBackend}?t=${new Date().getTime()}`;
            } else if (!utilisateur.avatarUrl) {
                utilisateur_mis_a_jour.avatarUrl = urlAvatarBackend;
            }

            localStorage.setItem('user', JSON.stringify(utilisateur_mis_a_jour));
            setUtilisateur(utilisateur_mis_a_jour);
            setFichierImage(null); 
            setNouvelleImagePreview(null);
            setErreurImage(false);

            window.dispatchEvent(new Event('profilMisAJour'));

            setMessageNotification('Profil mis à jour avec succès');
            setTimeout(() => setMessageNotification(''), 3000);
        } catch (erreur) {
            setMessageNotification('Erreur: ' + (erreur.response?.data?.message || erreur.message));
        }
    };

    const changerMotDePasse = async (e) => {
        e.preventDefault();
        if (donnees_mot_de_passe.nouveau_mot_de_passe !== donnees_mot_de_passe.confirmer_mot_de_passe) {
            setMessageNotification('Les mots de passe ne correspondent pas');
            return;
        }
        try {
            const jeton_authentification = localStorage.getItem('token');
            await axios.post(
                'http://localhost:3000/api/change-password',
                {
                    ancienMdp: donnees_mot_de_passe.ancien_mot_de_passe,
                    nouveauMdp: donnees_mot_de_passe.nouveau_mot_de_passe,
                    confirmationMdp: donnees_mot_de_passe.confirmer_mot_de_passe
                },
                { headers: { Authorization: `Bearer ${jeton_authentification}` } }
            );
            setMessageNotification('Mot de passe changé avec succès');
            setDonneesMotDePasse({ 
                ancien_mot_de_passe: '', 
                nouveau_mot_de_passe: '', 
                confirmer_mot_de_passe: '' 
            });
            setTimeout(() => setMessageNotification(''), 3000);
        } catch (erreur) {
            setMessageNotification('Erreur: ' + (erreur.response?.data?.message || erreur.message));
        }
    };

    const confirmerSuppressionCompte = async (e) => {
        e.preventDefault();
        try {
            const jeton_authentification = localStorage.getItem('token');
            await axios.delete('http://localhost:3000/api/users', {
                headers: { Authorization: `Bearer ${jeton_authentification}` },
                data: { mot_de_passe: motDePasseSuppression }
            });
            
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            window.location.href = '/';
            
        } catch { 
            setMessageNotification('Erreur : Mot de passe incorrect');
            setAfficherModalSuppression(false);
            setMotDePasseSuppression('');
        }
    };

    return {
        fileInputRef,
        nouvelleImagePreview,
        erreurImage, setErreurImage,
        afficherModalSuppression, setAfficherModalSuppression,
        motDePasseSuppression, setMotDePasseSuppression,
        utilisateur,
        donnees_formulaire,
        donnees_mot_de_passe,
        message_notification,
        gestionChangementProfil,
        gestionChangementMotDePasse,
        declencherSelectionFichier,
        gestionChangementImage,
        mettreAJourProfil,
        changerMotDePasse,
        confirmerSuppressionCompte
    };
}
