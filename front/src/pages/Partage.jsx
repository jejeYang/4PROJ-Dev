import React from 'react';
import { useVoirPartage } from '../hooks/useVoirPartage';
import '../styles/Partage.css';

function Partage() {
    const { 
        liensPublics, partagesEnvoyes, partagesRecus, 
        chargement, erreur, setErreur, 
        supprimerLienPublic, resilierPartageInterne 
    } = useVoirPartage();

    if (chargement) return <div className="partage-page-container"><div className="loader">Chargement...</div></div>;

    return (
        <div className="partage-page-container">
            <div className="dashboard-wrapper">
                <header className="dashboard-welcome">
                    <h1>Gestion des partages 🤝</h1>
                    <p>Gérez vos accès, vos envois et vos liens publics en un clin d'œil.</p>
                </header>

                {erreur && (
                    <div className="alert-danger">
                        <span>{erreur}</span>
                        <button className="alert-close" onClick={() => setErreur('')}>✕</button>
                    </div>
                )}

                <div className="partages-grid">
                    
                    <div className="data-panel full-width">
                        <div className="panel-header-desc">
                            <h3>Partages reçus</h3>
                            <p>Dossiers partagés par d'autres utilisateurs avec vous.</p>
                        </div>
                        <div className="wide-list">
                            {partagesRecus.length === 0 ? <div className="empty-state">Aucun dossier reçu.</div> : 
                                partagesRecus.map(p => (
                                    <div key={p.idDossier} className="wide-list-item">
                                        <div className="item-main">
                                            <span className="file-icon">📥</span>
                                            <span className="file-name">{p.cheminDaccesDossier}</span>
                                        </div>
                                        <div className="item-side">
                                            <span className="file-date">Reçu le {new Date(p.dateCreation).toLocaleDateString()}</span>
                                            <button className="btn-danger-outline" onClick={() => resilierPartageInterne(p.idDossier)}>Quitter</button>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    <div className="data-panel full-width">
                        <div className="panel-header-desc">
                            <h3>Partages envoyés</h3>
                            <p>Dossiers que vous avez partagés avec d'autres comptes.</p>
                        </div>
                        <div className="wide-list">
                            {partagesEnvoyes.length === 0 ? <div className="empty-state">Aucun partage envoyé.</div> : 
                                partagesEnvoyes.map(p => (
                                    <div key={p.idDossier} className="wide-list-item">
                                        <div className="item-main">
                                            <span className="file-icon">📤</span>
                                            <span className="file-name">{p.cheminDaccesDossier}</span>
                                        </div>
                                        <div className="item-side">
                                            <span className="file-date">Envoyé le {new Date(p.dateCreation).toLocaleDateString()}</span>
                                            <button className="btn-danger-outline" onClick={() => resilierPartageInterne(p.idDossier)}>Révoquer</button>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    <div className="data-panel full-width">
                        <div className="panel-header-desc">
                            <h3>Liens publics (Invités)</h3>
                            <p>Liens actifs accessibles via URL.</p>
                        </div>
                        <div className="wide-list">
                            {liensPublics.length === 0 ? <div className="empty-state">Aucun lien généré.</div> : 
                                liensPublics.map(l => (
                                    <div key={l.idLien} className="wide-list-item">
                                        <div className="item-main">
                                            <span className="file-icon">{l.type === 'dossier' ? '📁' : '📄'}</span>
                                            <span className="file-name">{l.nom}</span>
                                            <span className={`tag-status ${l.protege ? 'tag-protege' : 'tag-public'}`}>
                                                {l.protege ? '🔒 Protégé' : '🔓 Public'}
                                            </span>
                                        </div>
                                        <div className="item-side">
                                            <button className="btn-danger-outline" onClick={() => supprimerLienPublic(l.idLien)}>Supprimer</button>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Partage;