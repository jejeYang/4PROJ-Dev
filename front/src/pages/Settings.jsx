import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Settings.css';
import { ThemeContext } from '../context/theme_context';

function Settings() {
    const [utilisateur, setUtilisateur] = useState(() => {
        const donneesSauvegardees = localStorage.getItem('user');
        return donneesSauvegardees ? JSON.parse(donneesSauvegardees) : null;
    });

    const [donneesFormulaire, setDonneesFormulaire] = useState(() => {
        const donneesSauvegardees = localStorage.getItem('user');
        if (donneesSauvegardees) {
            const parsed = JSON.parse(donneesSauvegardees);
            return { nom: parsed.nom, email: parsed.email };
        }
        return { nom: '', email: '' };
    });

    const [donneesMotDePasse, setDonneesMotDePasse] = useState({ 
        ancienMotDePasse: '', 
        nouveauMotDePasse: '', 
        confirmerMotDePasse: '' 
    });
    
    const [messageNotification, setMessageNotification] = useState('');
    const naviguer = useNavigate();
    const { toggle, toggleFunction } = useContext(ThemeContext);

    const gestionChangementProfil = (e) => {
        setDonneesFormulaire({ ...donneesFormulaire, [e.target.name]: e.target.value });
    };

    const gestionChangementMotDePasse = (e) => {
        setDonneesMotDePasse({ ...donneesMotDePasse, [e.target.name]: e.target.value });
    };

    const mettreAJourProfil = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:3000/api/users/${utilisateur.id}`,
                donneesFormulaire,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const utilisateurMisAJour = { ...utilisateur, ...donneesFormulaire };
            localStorage.setItem('user', JSON.stringify(utilisateurMisAJour));
            setUtilisateur(utilisateurMisAJour);
            setMessageNotification('Profil mis à jour avec succès');
            setTimeout(() => setMessageNotification(''), 3000);
        } catch (erreur) {
            setMessageNotification('Erreur: ' + (erreur.response?.data?.message || erreur.message));
        }
    };

    const changerMotDePasse = async (e) => {
        e.preventDefault();
        if (donneesMotDePasse.nouveauMotDePasse !== donneesMotDePasse.confirmerMotDePasse) {
            setMessageNotification('Les mots de passe ne correspondent pas');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:3000/api/change-password',
                {
                    oldPassword: donneesMotDePasse.ancienMotDePasse,
                    newPassword: donneesMotDePasse.nouveauMotDePasse
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessageNotification('Mot de passe changé avec succès');
            setDonneesMotDePasse({ ancienMotDePasse: '', nouveauMotDePasse: '', confirmerMotDePasse: '' });
            setTimeout(() => setMessageNotification(''), 3000);
        } catch (erreur) {
            setMessageNotification('Erreur: ' + (erreur.response?.data?.message || erreur.message));
        }
    };

    const supprimerCompte = () => {
        if (window.confirm('Êtes-vous sûr ? Cette action est irréversible.')) {
            try {
                const token = localStorage.getItem('token');
                axios.delete('http://localhost:3000/api/users', {
                    headers: { Authorization: `Bearer ${token}` }
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
        <div className="settings-container">
            <header className="settings-header">
                <h1>Paramètres</h1>
                <p>Gérez vos informations personnelles et la sécurité de votre compte</p>
            </header>

            {messageNotification && <div className="message-toast">{messageNotification}</div>}

            <div className="settings-layout">
                <div className="settings-main-column">
                    <section className="settings-card profile-section">
                        <div className="profile-header-visual">
                            <div className="avatar-placeholder">
                                {donneesFormulaire.nom.charAt(0).toUpperCase()}
                            </div>
                            <h3>Mon Profil</h3>
                        </div>
                        
                        <form onSubmit={mettreAJourProfil} className="settings-form">
                            <div className="form-group">
                                <label>Nom d'utilisateur</label>
                                <input type="text" name="nom" value={donneesFormulaire.nom} onChange={gestionChangementProfil} required />
                            </div>
                            <div className="form-group">
                                <label>Email professionnel</label>
                                <input type="email" name="email" value={donneesFormulaire.email} onChange={gestionChangementProfil} required />
                            </div>
                            <button type="submit" className="btn-update">Mettre à jour le profil</button>
                        </form>
                    </section>

                    <section className="settings-card">
                        <h3>Sécurité du mot de passe</h3>
                        <form onSubmit={changerMotDePasse} className="settings-form">
                            <div className="form-group">
                                <label>Ancien mot de passe</label>
                                <input type="password" name="ancienMotDePasse" value={donneesMotDePasse.ancienMotDePasse} onChange={gestionChangementMotDePasse} required />
                            </div>
                            <div className="form-group-row">
                                <div className="form-group">
                                    <label>Nouveau</label>
                                    <input type="password" name="nouveauMotDePasse" value={donneesMotDePasse.nouveauMotDePasse} onChange={gestionChangementMotDePasse} required />
                                </div>
                                <div className="form-group">
                                    <label>Confirmation</label>
                                    <input type="password" name="confirmerMotDePasse" value={donneesMotDePasse.confirmerMotDePasse} onChange={gestionChangementMotDePasse} required />
                                </div>
                            </div>
                            <button type="submit" className="btn-outline">Changer le mot de passe</button>
                        </form>
                    </section>
                </div>

                <div className="settings-side-column">
                    <section className="settings-card danger-zone">
                        <h3>Zone de danger</h3>
                        <p>La suppression de votre compte est définitive. Toutes vos données seront effacées.</p>
                        <button onClick={supprimerCompte} className="btn-danger">Supprimer mon compte</button>
                    </section>

                    <section className="settings-card theme-switcher">
                        <h3>Apparence</h3>
                        <p>Personnalisez votre interface</p>
                        <div className="toggle-container" onClick={toggleFunction}>
                            <div className={`toggle-track ${toggle ? 'active' : ''}`}>
                                <div className="toggle-ball"></div>
                            </div>
                            <span>Thème {toggle ? 'Sombre' : 'Clair'}</span>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default Settings;