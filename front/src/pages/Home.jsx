import React from 'react';
import { Link } from 'react-router-dom';
import { useHome } from '../hooks/useHome';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/Home.css';

const COULEURS = ['#06BCC1', '#474973', '#161B33', '#bcb6b6', '#e6f2ff'];

function Home() {
    const { estAuthentifie, nomUtilisateur, stats, chargement, formatOctets } = useHome();

    if (chargement) return <div className="home-container">Chargement...</div>;

    return (
        <div className="home-container">
            {estAuthentifie && stats ? (
                <div className="dashboard-panel">
                    <header className="dashboard-header">
                        <h1>Bienvenue, {nomUtilisateur} !</h1>
                        <p>Aperçu de votre activité et stockage</p>
                    </header>

                    <div className="actions-accueil">
                        <Link to="/dashboard" className="bloc-action-accueil">
                            <span className="icon-action-accueil">📁</span>
                            <h3>Mon Espace</h3>
                        </Link>
                        <Link to="/upload" className="bloc-action-accueil">
                            <span className="icon-action-accueil">☁️</span>
                            <div className="primary-btn-inner">Uploader</div>
                        </Link>
                        <Link to="/settings" className="bloc-action-accueil">
                            <span className="icon-action-accueil">⚙️</span>
                            <h3>Paramètres</h3>
                        </Link>
                    </div>

                    <div className="stats-grid">
                        {/* Graphique Stockage */}
                        <div className="stat-card">
                            <h3>Stockage Utilisé</h3>
                            <ResponsiveContainer width="100%" height={150}>
                                <PieChart>
                                    <Pie data={[{v: stats.stockage.utilise}, {v: stats.stockage.total - stats.stockage.utilise}]} innerRadius={45} outerRadius={60} dataKey="v" stroke="none">
                                        <Cell fill="var(--btn-primary-color)" /><Cell fill="var(--bg-secondary-color)" />
                                    </Pie>
                                    <Tooltip formatter={(val) => formatOctets(val)} />
                                </PieChart>
                            </ResponsiveContainer>
                            <p className="stat-label">{formatOctets(stats.stockage.utilise)} / {formatOctets(stats.stockage.total)}</p>
                        </div>

                        <div className="stat-card">
                            <h3>Types de fichiers</h3>
                            <ResponsiveContainer width="100%" height={150}>
                                <PieChart>
                                    <Pie data={stats.typesFichiers} outerRadius={60} dataKey="value" stroke="none">
                                        {stats.typesFichiers.map((e, i) => <Cell key={i} fill={COULEURS[i % COULEURS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="stat-card list-card">
                            <h3>Plus gros fichiers</h3>
                            <ul className="stat-list">
                                {stats.plusGrosFichiers.map((f, i) => (
                                    <li key={i}>
                                        <Link to={`/dashboard?folder=${f.idDossierParent}`} className="stat-link">
                                            <span className="file-name">{f.nom}</span>
                                            <span className="file-info">{formatOctets(f.taille)}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="stat-card list-card">
                            <h3>Visionnés récemment</h3>
                            <ul className="stat-list">
                                {stats.derniersFichiers.map((f, i) => (
                                    <li key={i}>
                                        <Link to={`/dashboard?folder=${f.idDossierParent}`} className="stat-link">
                                            <span className="file-name">{f.nom}</span>
                                            <span className="file-date">{new Date(f.atime).toLocaleDateString()}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="stat-card list-card">
                            <h3>Dossiers récents</h3>
                            <ul className="stat-list">
                                {stats.derniersDossiers.map((d, i) => (
                                    <li key={i}>
                                        <Link to={`/dashboard?folder=${d.idDossier}`} className="stat-link">
                                            <span className="folder-name">📁 {d.nom}</span>
                                            <span className="folder-date">{new Date(d.mtime).toLocaleDateString()}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bloc-bienvenue">
                    <div className="contenu-bienvenue">
                        <h1>Partagez vos fichiers en toute sécurité</h1>
                        <p>SUPFile : Votre plateforme de partage simple et sécurisée</p>
                        <div>
                            <Link to="/register" className="btn-upload">Rejoindre SUPFile</Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;