import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Settings.css';
import { ThemeContext } from '../context/theme_context';

function Settings() {
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

    const gestionChangementProfil = (e) => {
        setDonneesFormulaire({ ...donnees_formulaire, [e.target.name]: e.target.value });
    };

    const gestionChangementMotDePasse = (e) => {
        setDonneesMotDePasse({ ...donnees_mot_de_passe, [e.target.name]: e.target.value });
    };

    const mettreAJourProfil = async (e) => {
        e.preventDefault();
        try {
            const jeton_authentification = localStorage.getItem('token');
            await axios.put(
                `http://localhost:3000/api/users/${utilisateur.id}`,
                donnees_formulaire,
                { headers: { Authorization: `Bearer ${jeton_authentification}` } }
            );
            const utilisateur_mis_a_jour = { ...utilisateur, ...donnees_formulaire };
            localStorage.setItem('user', JSON.stringify(utilisateur_mis_a_jour));
            setUtilisateur(utilisateur_mis_a_jour);
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

    const supprimerCompte = () => {
        if (window.confirm('Êtes-vous sûr ? Cette action est irréversible.')) {
            try {
                const jeton_authentification = localStorage.getItem('token');
                axios.delete('http://localhost:3000/api/users', {
                    headers: { Authorization: `Bearer ${jeton_authentification}` }
                });
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                naviguer('/');
            } catch { 
                setMessageNotification('Erreur lors de la suppression');
            }
        }
    };

    if (!utilisateur) return <div>Vous n'êtes pas connecté.</div>;

    return (
        <div className="conteneur-parametres">
            <header className="en-tete-parametres">
                <h1>Paramètres</h1>
                <p>Gérez vos informations personnelles et la sécurité de votre compte</p>
            </header>

            {message_notification && <div className="notification-message">{message_notification}</div>}

            <div className="disposition-parametres">
                <div className="colonne-principale-parametres">
                    <section className="carte-parametres section-profil">
                        <div className="en-tete-visuel-profil">
                            <div className="espace-avatar">
                                {donnees_formulaire.nom.charAt(0).toUpperCase()}
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
                        <button onClick={supprimerCompte} className="btn-danger">Supprimer mon compte</button>
                    </section>

                    <section className="carte-parametres changeur-theme">
                        <h3>Apparence</h3>
                        <p>Personnalisez votre interface</p>
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