import React from 'react';
import { Link } from 'react-router-dom';
import { useHome } from '../hooks/useHome';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/Home.css';

const COULEURS = ['#06BCC1', '#474973', '#161B33', '#bcb6b6', '#e6f2ff'];

function Home() {
    const { estAuthentifie, nomUtilisateur, stats, chargement, formatOctets } = useHome();

    if (chargement) return <div className="accueil-conteneur"><div className="accueil-chargement">Chargement...</div></div>;

    return (
        <div className="accueil-conteneur">
            {estAuthentifie && stats ? (
                <div className="accueil-enveloppe-tableau">
                    <header className="accueil-entete-bienvenue">
                        <h1>Bienvenue, {nomUtilisateur}</h1>
                    </header>

                    <div className="accueil-grille-actions">
                        <Link to="/dashboard" className="accueil-carte-action-geante">
                            <span className="accueil-icone-geante">📂</span>
                            <div className="accueil-contenu-carte-geante">
                                <h3>Mon Espace</h3>
                                <p>Gérez vos fichiers</p>
                            </div>
                        </Link>
                        <Link to="/upload" className="accueil-carte-action-geante accueil-action-primaire">
                            <span className="accueil-icone-geante">📤</span>
                            <div className="accueil-contenu-carte-geante">
                                <h3>Uploader</h3>
                                <p>Ajoutez des documents</p>
                            </div>
                        </Link>
                        <Link to="/settings" className="accueil-carte-action-geante">
                            <span className="accueil-icone-geante">⚙️</span>
                            <div className="accueil-contenu-carte-geante">
                                <h3>Paramètres</h3>
                                <p>Profil & Sécurité</p>
                            </div>
                        </Link>
                    </div>

                    <div className="accueil-grille-principale">
                        
                        <div className="accueil-panneau-donnees accueil-mise-en-avant-stockage">
                            <div className="accueil-en-tete-panneau"><h3>État du Stockage</h3></div>
                            <div className="accueil-flex-stockage">
                                <div className="accueil-graphique-stockage">
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
                                    <div className="accueil-superposition-graphique">
                                        <span className="accueil-pourcentage">{((stats.stockage.utilise / stats.stockage.total) * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                                <div className="accueil-details-stockage">
                                    <div className="accueil-element-detail"><span>Utilisé</span><strong>{formatOctets(stats.stockage.utilise)}</strong></div>
                                    <div className="accueil-element-detail"><span>Total</span><strong>{formatOctets(stats.stockage.total)}</strong></div>
                                    <div className="accueil-barre-stockage-totale">
                                        <div className="accueil-remplissage-stockage" style={{width: `${(stats.stockage.utilise / stats.stockage.total) * 100}%`}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="accueil-panneau-donnees">
                            <div className="accueil-en-tete-panneau"><h3>Répartition</h3></div>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={stats.typesFichiers} outerRadius={80} dataKey="value" stroke="none">
                                        {stats.typesFichiers.map((e, i) => <Cell key={i} fill={COULEURS[i % COULEURS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="accueil-panneau-donnees accueil-pleine-largeur">
                            <div className="accueil-en-tete-panneau"><h3>Plus gros fichiers</h3></div>
                            <div className="accueil-liste-large">
                                {stats.plusGrosFichiers.slice(0, 3).map((f, i) => (
                                    <Link key={i} to={`/dashboard?folder=${f.idDossierParent}`} className="accueil-element-liste-large">
                                        <div className="accueil-element-principal"><span className="accueil-icone-fichier">⚖️</span><span className="accueil-nom-fichier">{f.nom}</span></div>
                                        <div className="accueil-element-lateral"><span className="accueil-taille-fichier">{formatOctets(f.taille)}</span></div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="accueil-panneau-donnees">
                            <div className="accueil-en-tete-panneau"><h3>Vus récemment</h3></div>
                            <div className="accueil-liste-compacte">
                                {stats.derniersFichiers.slice(0, 4).map((f, i) => (
                                    <Link key={i} to={`/dashboard?folder=${f.idDossierParent}`} className="accueil-element-compact">
                                        <span className="accueil-nom-fichier">{f.nom}</span>
                                        <span className="accueil-date-fichier">{new Date(f.atime).toLocaleDateString()}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="accueil-panneau-donnees">
                            <div className="accueil-en-tete-panneau"><h3>Dossiers récents</h3></div>
                            <div className="accueil-liste-compacte">
                                {stats.derniersDossiers.slice(0, 4).map((d, i) => (
                                    <Link key={i} to={`/dashboard?folder=${d.idDossier}`} className="accueil-element-compact">
                                        <span className="accueil-nom-dossier">📁 {d.nom}</span>
                                        <span className="accueil-date-dossier">{new Date(d.mtime).toLocaleDateString()}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            ) : (
                <div className="accueil-banniere-visiteur">
                    <h1>Gérez vos fichiers avec <span>fluidité.</span></h1>
                    <p>La solution de stockage sécurisée de SUPINFO.</p>
                    <div className="accueil-actions-visiteur">
                        <Link to="/register" className="accueil-bouton-principal">Créer un compte</Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;