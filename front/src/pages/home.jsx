import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        setIsAuthenticated(!!token);
        if (user) {
            const userData = JSON.parse(user);
            setUsername(userData.nom || userData.email || 'User');
        }
    }, []);

    return (
        <div className="home-container">
            {isAuthenticated ? (
                <div className="dashboard-panel">
                    <header className="dashboard-header">
                        <h1>Bienvenue, {username} !</h1>
                        <p>Gérez vos fichiers en toute sécurité</p>
                    </header>

                    <div className="quick-actions">
                        <Link to="/dashboard" className="action-card">
                            <span className="icon-wrapper">📁</span>
                            <h3>Mon Espace</h3>
                            <p>Voir mes fichiers</p>
                        </Link>
                        
                        <Link to="/upload" className="action-card">
                            <span className="icon-wrapper">☁️</span>
                            <div className="primary-btn-inner">Uploader</div>
                            <p>Ajouter des fichiers</p>
                        </Link>
                        
                        <Link to="/settings" className="action-card">
                            <span className="icon-wrapper">⚙️</span>
                            <h3>Paramètres</h3>
                            <p>Gérer mon compte</p>
                        </Link>
                    </div>

                    <div className="user-info-bar">
                        <div className="info-left">
                            <span className="info-icon">📄</span>
                            <div className="info-text">
                                <span className="info-title">Mon Espace</span>
                                <span className="info-desc">Activité récente</span>
                            </div>
                        </div>
                        <div className="info-right">
                            <span className="stat-name">{username}</span>
                            <span className="stat-role">Utilisateur</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="hero-section">
                    <div className="hero-content">
                        <h1>Partagez vos fichiers en toute sécurité</h1>
                        <p>SUPFile : Votre plateforme de partage de fichiers simple et sécurisée</p>
                        <div className="hero-cta">
                            <Link to="/register" className="btn-upload">
                                Publier un fichier
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;