import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Settings.css';
import { ThemeContext } from '../context/theme_context';

function Settings() {
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({ nom: '', email: '' });
    const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const { toggle, toggleFunction } = useContext(ThemeContext);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
            setUser(userData);
            setFormData({ nom: userData.nom, email: userData.email });
            setLoading(false);
        }
    }, []);

    const handleProfileChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `http://localhost:3000/api/users/${user.id}`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage('Profil mis à jour avec succès');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Erreur: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage('Les mots de passe ne correspondent pas');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:3000/api/change-password',
                {
                    oldPassword: passwordData.oldPassword,
                    newPassword: passwordData.newPassword
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage('Mot de passe changé avec succès');
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Erreur: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteAccount = () => {
        if (window.confirm('Êtes-vous sûr ? Cette action est irréversible.')) {
            if (window.confirm('Êtes-vous vraiment sûr ?')) {
                try {
                    const token = localStorage.getItem('token');
                    axios.delete('http://localhost:3000/api/users', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/');
                } catch (error) {
                    setMessage('Erreur lors de la suppression');
                }
            }
        }
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="settings-container">
            <div className="settings-header">
                <h1>Paramètres</h1>
            </div>

            {message && <div className="message">{message}</div>}

            <div className="settings-grid">
                {/* Profile Settings */}
                <div className="settings-card">
                    <h2>Informations du profil</h2>
                    <form onSubmit={handleUpdateProfile}>
                        <div className="form-group">
                            <label>Nom d'utilisateur</label>
                            <input
                                type="text"
                                name="nom"
                                value={formData.nom}
                                onChange={handleProfileChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleProfileChange}
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary">
                            Mettre à jour
                        </button>
                    </form>
                </div>

                {/* Password Settings */}
                <div className="settings-card">
                    <h2>Changer le mot de passe</h2>
                    <form onSubmit={handleChangePassword}>
                        <div className="form-group">
                            <label>Ancien mot de passe</label>
                            <input
                                type="password"
                                name="oldPassword"
                                value={passwordData.oldPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Nouveau mot de passe</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirmer le mot de passe</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary">
                            Changer le mot de passe
                        </button>
                    </form>
                </div>

                {/* Danger Zone */}
                <div className="settings-card danger">
                    <h2>Zone de danger</h2>
                    <p>Supprimer votre compte supprimera tous vos fichiers et données.</p>
                    <button onClick={handleDeleteAccount} className="btn-danger">
                        Supprimer le compte
                    </button>
                </div>

                {/* Theme Settings */}
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
