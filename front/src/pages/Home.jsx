import React from 'react';
import { Link } from 'react-router-dom';
import { useHome } from '../hooks/useHome';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/Home.css';

const COULEURS = ['#06BCC1', '#474973', '#161B33', '#bcb6b6', '#e6f2ff'];

function Home() {
    const { estAuthentifie, nomUtilisateur, stats, chargement, formatOctets } = useHome();

    if (chargement) return <div className="home-container"><div className="loader">Chargement...</div></div>;

    return (
        <div className="home-container">
            {estAuthentifie && stats ? (
                <div className="dashboard-wrapper">
                    <header className="dashboard-welcome">
                        <h1>Bienvenue, {nomUtilisateur} 👋</h1>
                        <p>Voici l'aperçu complet de votre activité.</p>
                    </header>

                    <div className="actions-hero-grid">
                        <Link to="/dashboard" className="action-huge-card">
                            <span className="huge-icon">📂</span>
                            <div className="huge-card-content">
                                <h3>Mon Espace</h3>
                                <p>Gérez vos fichiers</p>
                            </div>
                        </Link>
                        <Link to="/upload" className="action-huge-card primary">
                            <span className="huge-icon">📤</span>
                            <div className="huge-card-content">
                                <h3>Uploader</h3>
                                <p>Ajoutez des documents</p>
                            </div>
                        </Link>
                        <Link to="/settings" className="action-huge-card">
                            <span className="huge-icon">⚙️</span>
                            <div className="huge-card-content">
                                <h3>Paramètres</h3>
                                <p>Profil & Sécurité</p>
                            </div>
                        </Link>
                    </div>

                    <div className="main-dashboard-grid">
                        
                        <div className="data-panel storage-highlight">
                            <div className="panel-header"><h3>État du Stockage</h3></div>
                            <div className="storage-flex">
                                <div className="storage-chart">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie 
                                                data={[{v: stats.stockage.utilise}, {v: Math.max(0, stats.stockage.total - stats.stockage.utilise)}]} 
                                                innerRadius={60} outerRadius={80} dataKey="v" stroke="none" paddingAngle={5}
                                            >
                                                <Cell fill="#06BCC1" />
                                                <Cell fill="var(--bg-secondary-color)" />
                                            </Pie>
                                            <Tooltip formatter={(val) => formatOctets(val)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="chart-overlay">
                                        <span className="percent">{((stats.stockage.utilise / stats.stockage.total) * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                                <div className="storage-details">
                                    <div className="detail-item"><span>Utilisé</span><strong>{formatOctets(stats.stockage.utilise)}</strong></div>
                                    <div className="detail-item"><span>Total</span><strong>{formatOctets(stats.stockage.total)}</strong></div>
                                    <div className="storage-bar-total">
                                        <div className="storage-bar-fill" style={{width: `${(stats.stockage.utilise / stats.stockage.total) * 100}%`}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="data-panel">
                            <div className="panel-header"><h3>Répartition</h3></div>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={stats.typesFichiers} outerRadius={80} dataKey="value" stroke="none">
                                        {stats.typesFichiers.map((e, i) => <Cell key={i} fill={COULEURS[i % COULEURS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="data-panel full-width">
                            <div className="panel-header"><h3>Plus gros fichiers</h3></div>
                            <div className="wide-list">
                                {stats.plusGrosFichiers.slice(0, 3).map((f, i) => (
                                    <Link key={i} to={`/dashboard?folder=${f.idDossierParent}`} className="wide-list-item">
                                        <div className="item-main"><span className="file-icon"></span><span className="file-name">{f.nom}</span></div>
                                        <div className="item-side"><span className="file-size">{formatOctets(f.taille)}</span></div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="data-panel">
                            <div className="panel-header"><h3>Vus récemment</h3></div>
                            <div className="compact-list">
                                {stats.derniersFichiers.slice(0, 4).map((f, i) => (
                                    <Link key={i} to={`/dashboard?folder=${f.idDossierParent}`} className="compact-item">
                                        <span className="file-name">{f.nom}</span>
                                        <span className="file-date">{new Date(f.atime).toLocaleDateString()}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="data-panel">
                            <div className="panel-header"><h3>Dossiers récents</h3></div>
                            <div className="compact-list">
                                {stats.derniersDossiers.slice(0, 4).map((d, i) => (
                                    <Link key={i} to={`/dashboard?folder=${d.idDossier}`} className="compact-item">
                                        <span className="folder-name">📁 {d.nom}</span>
                                        <span className="folder-date">{new Date(d.mtime).toLocaleDateString()}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            ) : (
                <div className="landing-hero">
                    <h1>Gérez vos fichiers avec <span>fluidité.</span></h1>
                    <p>La solution de stockage sécurisée de SUPINFO.</p>
                    <div className="landing-actions">
                        <Link to="/register" className="btn-main">Créer un compte</Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;