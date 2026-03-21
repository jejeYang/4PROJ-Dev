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
            // Correction ESLint : on utilise await sans assigner à 'response' car on ne s'en sert pas
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
            if (window.confirm('Êtes-vous vraiment sûr ?')) {
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
        }
    };

    if (!utilisateur) return <div>Vous n'êtes pas connecté.</div>;

    return (
        <div className="settings-container">
            <div className="settings-header">
                <h1>Paramètres</h1>
            </div>

            {messageNotification && <div className="message">{messageNotification}</div>}

            <div className="settings-grid">
                {/* Paramètres du profil */}
                <div className="settings-card">
                    <h2>Informations du profil</h2>
                    <form onSubmit={mettreAJourProfil}>
                        <div className="form-group">
                            <label>Nom d'utilisateur</label>
                            <input
                                type="text"
                                name="nom"
                                value={donneesFormulaire.nom}
                                onChange={gestionChangementProfil}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={donneesFormulaire.email}
                                onChange={gestionChangementProfil}
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary">
                            Mettre à jour
                        </button>
                    </form>
                </div>

                <div className="settings-card">
                    <h2>Changer le mot de passe</h2>
                    <form onSubmit={changerMotDePasse}>
                        <div className="form-group">
                            <label>Ancien mot de passe</label>
                            <input
                                type="password"
                                name="ancienMotDePasse"
                                value={donneesMotDePasse.ancienMotDePasse}
                                onChange={gestionChangementMotDePasse}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Nouveau mot de passe</label>
                            <input
                                type="password"
                                name="nouveauMotDePasse"
                                value={donneesMotDePasse.nouveauMotDePasse}
                                onChange={gestionChangementMotDePasse}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirmer le mot de passe</label>
                            <input
                                type="password"
                                name="confirmerMotDePasse"
                                value={donneesMotDePasse.confirmerMotDePasse}
                                onChange={gestionChangementMotDePasse}
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary">
                            Changer le mot de passe
                        </button>
                    </form>
                </div>

                <div className="settings-card danger">
                    <h2>Zone de danger</h2>
                    <p>Supprimer votre compte supprimera tous vos fichiers et données.</p>
                    <button onClick={supprimerCompte} className="btn-danger">
                        Supprimer le compte
                    </button>
                </div>

                <div className="settings-card">
                    <h2>Thème</h2>
                    <button onClick={toggleFunction} className="btn-primary">
                        {toggle ? 'Passer au thème clair' : 'Passer au thème sombre'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Settings;