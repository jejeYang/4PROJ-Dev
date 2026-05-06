import React, { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Settings.css';
import { ThemeContext } from '../context/theme_context';

function Settings() {
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
    const naviguer = useNavigate();
    const { toggle: est_sombre, toggleFunction: changerTheme } = useContext(ThemeContext);

    const urlAvatarBackend = utilisateur ? `http://localhost:3000/api/users/avatar/${utilisateur.id || utilisateur.idCompte || utilisateur.idUtilisateur}` : null;

    const gestionChangementProfil = (e) => {
        setDonneesFormulaire({ ...donnees_formulaire, [e.target.name]: e.target.value });
    };

    const gestionChangementMotDePasse = (e) => {
        setDonneesMotDePasse({ ...donnees_mot_de_passe, [e.target.name]: e.target.value });
    };

    const declencherSelectionFichier = () => {
        fileInputRef.current.click();
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
                    oldPassword: donnees_mot_de_passe.ancien_mot_de_passe,
                    newPassword: donnees_mot_de_passe.nouveau_mot_de_passe
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
            
        } catch (erreur) { 
            setMessageNotification('Erreur : Mot de passe incorrect');
            setAfficherModalSuppression(false);
            setMotDePasseSuppression('');
        }
    };

    if (!utilisateur) return <div>Vous n'êtes pas connecté.</div>;

    const initialeAvatar = (utilisateur.nom || utilisateur.email || 'U').charAt(0).toUpperCase();

    return (
        <div className="conteneur-parametres">
            {afficherModalSuppression && (
                <div className="overlay-modal">
                    <div className="carte-parametres modal-danger">
                        <h3>⚠️ Action Irréversible</h3>
                        <p>Attention : Toutes vos données seront définitivement effacées. Veuillez saisir votre mot de passe pour confirmer.</p>
                        <form onSubmit={confirmerSuppressionCompte}>
                            <div className="groupe-formulaire">
                                <input 
                                    type="password" 
                                    placeholder="Mot de passe de confirmation"
                                    value={motDePasseSuppression}
                                    onChange={(e) => setMotDePasseSuppression(e.target.value)}
                                    required 
                                    autoFocus
                                />
                            </div>
                            <div className="rangee-boutons-modal">
                                <button type="button" onClick={() => setAfficherModalSuppression(false)} className="btn-annuler">Annuler</button>
                                <button type="submit" className="btn-danger">Supprimer mon compte</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <header className="en-tete-parametres">
                <h1>Paramètres</h1>
                <p>Gérez vos informations personnelles</p>
            </header>

            {message_notification && <div className="notification-message">{message_notification}</div>}

            <div className="disposition-parametres">
                <div className="colonne-principale-parametres">
                    <section className="carte-parametres section-profil">
                        <div className="en-tete-visuel-profil">
                            <div className="conteneur-avatar-edition">
                                <div className="espace-avatar">
                                    {nouvelleImagePreview ? (
                                        <img src={nouvelleImagePreview} alt="Aperçu avatar" className="image-avatar-siteweb" />
                                    ) : (utilisateur.avatarUrl && !erreurImage) ? (
                                        <img 
                                            src={utilisateur.avatarUrl} 
                                            alt="Avatar utilisateur" 
                                            className="image-avatar-siteweb" 
                                            onError={() => setErreurImage(true)}
                                        />
                                    ) : (
                                        initialeAvatar
                                    )}
                                </div>
                                <div className="bouton-editer-avatar" onClick={declencherSelectionFichier} title="Changer la photo de profil">
                                    <span className="icone-crayon">✎</span>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    style={{ display: 'none' }} 
                                    accept="image/*" 
                                    onChange={gestionChangementImage}
                                />
                            </div>
                            <h3>Mon Profil</h3>
                        </div>
                        
                        <form onSubmit={mettreAJourProfil} className="formulaire-parametres">
                            <div className="groupe-formulaire">
                                <label>Nom d'utilisateur</label>
                                <input 
                                    type="text" 
                                    name="nom" 
                                    value={donnees_formulaire.nom} 
                                    onChange={gestionChangementProfil} 
                                    required 
                                />
                            </div>
                            <div className="groupe-formulaire">
                                <label>Email professionnel</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={donnees_formulaire.email} 
                                    onChange={gestionChangementProfil} 
                                    required 
                                />
                            </div>
                            <button type="submit" className="btn-mise-a-jour">Mettre à jour le profil</button>
                        </form>
                    </section>

                    <section className="carte-parametres">
                        <h3>Sécurité du mot de passe</h3>
                        <form onSubmit={changerMotDePasse} className="formulaire-parametres">
                            <div className="groupe-formulaire">
                                <label>Ancien mot de passe</label>
                                <input 
                                    type="password" 
                                    name="ancien_mot_de_passe" 
                                    value={donnees_mot_de_passe.ancien_mot_de_passe} 
                                    onChange={gestionChangementMotDePasse} 
                                    required 
                                />
                            </div>
                            <div className="rangee-groupe-formulaire">
                                <div className="groupe-formulaire">
                                    <label>Nouveau</label>
                                    <input 
                                        type="password" 
                                        name="nouveau_mot_de_passe" 
                                        value={donnees_mot_de_passe.nouveau_mot_de_passe} 
                                        onChange={gestionChangementMotDePasse} 
                                        required 
                                    />
                                </div>
                                <div className="groupe-formulaire">
                                    <label>Confirmation</label>
                                    <input 
                                        type="password" 
                                        name="confirmer_mot_de_passe" 
                                        value={donnees_mot_de_passe.confirmer_mot_de_passe} 
                                        onChange={gestionChangementMotDePasse} 
                                        required 
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn-mise-a-jour">Changer le mot de passe</button>
                        </form>
                    </section>
                </div>

                <div className="colonne-laterale-parametres">
                    <section className="carte-parametres zone-danger">
                        <h3>Zone de danger</h3>
                        <p>La suppression de votre compte est définitive. Toutes vos données seront effacées.</p>
                        <button onClick={() => setAfficherModalSuppression(true)} className="btn-danger">Supprimer mon compte</button>
                    </section>

                    <section className="carte-parametres changeur-theme">
                        <h3>Apparence</h3>
                        <div className="conteneur-bascule" onClick={changerTheme}>
                            <div className={`piste-bascule ${est_sombre ? 'actif' : ''}`}>
                                <div className="bille-bascule"></div>
                            </div>
                            <span>Thème {est_sombre ? 'Sombre' : 'Clair'}</span>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default Settings;