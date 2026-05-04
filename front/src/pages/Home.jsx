import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
    const [est_authentifie] = useState(() => {
        const jeton = localStorage.getItem('token');
        return !!jeton;
    });

    const [nom_utilisateur] = useState(() => {
        const utilisateur = localStorage.getItem('user');
        if (utilisateur) {
            try {
                const donnees_utilisateur = JSON.parse(utilisateur);
                return donnees_utilisateur.nom || donnees_utilisateur.email || 'Utilisateur';
            } catch {
                return 'Utilisateur';
            }
        }
        return '';
    });

    return (
        <div className="home-container">
            {est_authentifie ? (
                <div className="dashboard-panel">
                    <div className="page-acceuil">
                        <header className="dashboard-header">
                            <h1>Bienvenue, {nom_utilisateur} !</h1>
                            <p>Gérez vos fichiers en toute sécurité</p>
                        </header>
                    </div>

                    <div className="actions-accueil">
                        <Link to="/dashboard" className="bloc-action-accueil">
                            <span className="icon-action-accueil">📁</span>
                            <h3>Mon Espace</h3>
                            <p>Voir mes fichiers</p>
                        </Link>
                        
                        <Link to="/upload" className="bloc-action-accueil">
                            <span className="icon-action-accueil">☁️</span>
                            <div className="primary-btn-inner">Uploader</div>
                            <p>Ajouter des fichiers</p>
                        </Link>
                        
                        <Link to="/settings" className="bloc-action-accueil">
                            <span className="icon-action-accueil">⚙️</span>
                            <h3>Paramètres</h3>
                            <p>Gérer mon compte</p>
                        </Link>
                    </div>

                    <div className="user-info">
                        <div className="info-gauche">
                            <span className="info-icon">📄</span>
                            <div className="info-texte">
                                <span className="info-titre">Mon Espace</span>
                                <span className="info-desc">Activité récente</span>
                            </div>
                        </div>
                        <div className="info-droit">
                            <span className="nom-stat">{nom_utilisateur}</span>
                            <span className="stat-user">Utilisateur</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bloc-bienvenue">
                    <div className="contenu-bienvenue">
                        <h1>Partagez vos fichiers en toute sécurité</h1>
                        <p>SUPFile : Votre plateforme de partage de fichiers simple et sécurisée</p>
                        <div>
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