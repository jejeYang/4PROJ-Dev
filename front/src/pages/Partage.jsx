import React from 'react';
import { useVoirPartage } from '../hooks/useVoirPartage';
import '../styles/Partage.css';

function Partage() {
    const { 
        liensPublics, partagesEnvoyes, partagesRecus, 
        chargement, erreur, setErreur, 
        supprimerLienPublic, resilierPartageInterne 
    } = useVoirPartage();

    if (chargement) return <div className="partage-conteneur-page"><div className="partage-chargement">Chargement...</div></div>;

    return (
        <div className="partage-conteneur-page">
            <div className="partage-enveloppe-tableau">
                <header className="partage-entete-bienvenue">
                    <h1>Gestion des partages 🤝</h1>
                    <p>Gérez vos accès, vos envois et vos liens publics en un clin d'œil.</p>
                </header>

                {erreur && (
                    <div className="partage-alerte-erreur">
                        <span>{erreur}</span>
                        <button className="partage-fermer-alerte" onClick={() => setErreur('')}>✕</button>
                    </div>
                )}

                <div className="partage-grille-principale">
                    
                    <div className="partage-panneau-donnees partage-pleine-largeur">
                        <div className="partage-en-tete-description">
                            <h3>Partages reçus</h3>
                            <p>Dossiers partagés par d'autres utilisateurs avec vous.</p>
                        </div>
                        <div className="partage-liste-large">
                            {partagesRecus.length === 0 ? <div className="partage-etat-vide">Aucun dossier reçu.</div> : 
                                partagesRecus.map(p => (
                                    <div key={p.idDossier} className="partage-element-liste">
                                        <div className="partage-element-principal">
                                            <span className="partage-icone-fichier">📥</span>
                                            <span className="partage-nom-fichier">{p.cheminDaccesDossier}</span>
                                        </div>
                                        <div className="partage-element-lateral">
                                            <span className="partage-date-fichier">Reçu le {new Date(p.dateCreation).toLocaleDateString()}</span>
                                            <button className="partage-bouton-danger-contour" onClick={() => resilierPartageInterne(p.idDossier)}>Quitter</button>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    <div className="partage-panneau-donnees partage-pleine-largeur">
                        <div className="partage-en-tete-description">
                            <h3>Partages envoyés</h3>
                            <p>Dossiers que vous avez partagés avec d'autres comptes.</p>
                        </div>
                        <div className="partage-liste-large">
                            {partagesEnvoyes.length === 0 ? <div className="partage-etat-vide">Aucun partage envoyé.</div> : 
                                partagesEnvoyes.map(p => (
                                    <div key={p.idDossier} className="partage-element-liste">
                                        <div className="partage-element-principal">
                                            <span className="partage-icone-fichier">📤</span>
                                            <span className="partage-nom-fichier">{p.cheminDaccesDossier}</span>
                                        </div>
                                        <div className="partage-element-lateral">
                                            <span className="partage-date-fichier">Envoyé le {new Date(p.dateCreation).toLocaleDateString()}</span>
                                            <button className="partage-bouton-danger-contour" onClick={() => resilierPartageInterne(p.idDossier)}>Révoquer</button>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    <div className="partage-panneau-donnees partage-pleine-largeur">
                        <div className="partage-en-tete-description">
                            <h3>Liens publics (Invités)</h3>
                            <p>Liens actifs accessibles via URL.</p>
                        </div>
                        <div className="partage-liste-large">
                            {liensPublics.length === 0 ? <div className="partage-etat-vide">Aucun lien généré.</div> : 
                                liensPublics.map(l => (
                                    <div key={l.idLien} className="partage-element-liste">
                                        <div className="partage-element-principal">
                                            <span className="partage-icone-fichier">{l.type === 'dossier' ? '📁' : '📄'}</span>
                                            <span className="partage-nom-fichier">{l.nom}</span>
                                            <span className={`partage-etiquette-statut ${l.protege ? 'partage-etiquette-protege' : 'partage-etiquette-public'}`}>
                                                {l.protege ? '🔒 Protégé' : '🔓 Public'}
                                            </span>
                                        </div>
                                        <div className="partage-element-lateral">
                                            <button className="partage-bouton-danger-contour" onClick={() => supprimerLienPublic(l.idLien)}>Supprimer</button>
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