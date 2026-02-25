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
                <div className="dashboard-quick">
                    <h1>Bienvenue, {username} !</h1>
                    <p>Gérez vos fichiers en toute sécurité</p>
                    <div className="quick-actions">
                        <Link to="/dashboard" className="action-card">
                            <span className="icon">📊</span>
                            <h3>Mon Espace</h3>
                            <p>Voir mes fichiers</p>
                        </Link>
                        <Link to="/upload" className="action-card primary">
                            <span className="icon">📤</span>
                            <h3>Uploader</h3>
                            <p>Ajouter des fichiers</p>
                        </Link>
                        <Link to="/settings" className="action-card">
                            <span className="icon">⚙️</span>
                            <h3>Paramètres</h3>
                            <p>Gérer mon compte</p>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="hero-section">
                    <div className="hero-content">
                        <h1>Partagez vos fichiers en toute sécurité</h1>
                        <p>SUPFile : Votre plateforme de partage de fichiers simple et sécurisée</p>
                        
                        <div className="hero-features">
                            <div className="feature">
                                <span className="feature-icon">🛡️</span>
                                <h3>Sécurisé</h3>
                                <p>Vos fichiers sont protégés avec le chiffrement</p>
                            </div>
                            <div className="feature">
                                <span className="feature-icon">⚡</span>
                                <h3>Rapide</h3>
                                <p>Uploads et downloads ultra-rapides</p>
                            </div>
                            <div className="feature">
                                <span className="feature-icon">🌐</span>
                                <h3>Accessible</h3>
                                <p>Accédez à vos fichiers de partout</p>
                            </div>
                        </div>

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