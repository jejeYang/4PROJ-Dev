import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoirPartage } from '../hooks/useVoirPartage';
import { FolderInput, FolderOutput, Link2, Lock, Unlock, File, Trash2 } from 'lucide-react';
import '../styles/Partage.css';

function Partage() {
    const navigate = useNavigate();
    const { 
        liensPublics, partagesEnvoyes, partagesRecus, 
        chargement, erreur, setErreur, 
        supprimerLienPublic, resilierPartageInterne 
    } = useVoirPartage();

    if (chargement) return <div className="dashboard-container"><div className="div-chargement">Chargement...</div></div>;

    const allerVersDossier = (idDossier) => {
        navigate(`/dashboard?folder=${idDossier}`);
    };

    const copierLien = (url) => {
        navigator.clipboard.writeText(`${window.location.origin}${url}`);
        alert("Lien copié dans le presse-papier !");
    };

    return (
        <div className="dashboard-container">
            <div className="partage-enveloppe-tableau">
                <header className="page-liste-header">
                    <h1>Gestion des partages</h1>
                    <p>Gérez vos accès, vos envois et vos liens publics en un clin d'œil.</p>
                </header>

                {erreur && (
                    <div className="page-liste-erreur-globale">
                        <span>{erreur}</span>
                        <button className="btn-fermer-erreur" onClick={() => setErreur('')}>✕</button>
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
                                    <div key={p.idDossier} className="partage-element-liste cliquable" onClick={() => allerVersDossier(p.idDossier)}>
                                        <div className="partage-element-principal">
                                            <span className="partage-icone-fichier" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                                <FolderInput size={22} style={{ color: 'var(--btn-primary-color)' }} />
                                            </span>
                                            <div className="partage-infos-texte">
                                                <span className="partage-nom-fichier">{p.cheminDaccesDossier}</span>
                                                <span className="partage-email">De : {p.emailContact || 'Utilisateur inconnu'}</span>
                                            </div>
                                        </div>
                                        <div className="partage-element-lateral">
                                            <span className="partage-date-fichier">Reçu le {new Date(p.dateCreation).toLocaleDateString()}</span>
                                            <button className="partage-bouton-danger-contour" onClick={(e) => { e.stopPropagation(); resilierPartageInterne(p.idDossier); }}>Quitter</button>
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
                                    <div key={p.idDossier} className="partage-element-liste cliquable" onClick={() => allerVersDossier(p.idDossier)}>
                                        <div className="partage-element-principal">
                                            <span className="partage-icone-fichier" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                                <FolderOutput size={22} style={{ color: 'var(--btn-primary-color)' }} />
                                            </span>
                                            <div className="partage-infos-texte">
                                                <span className="partage-nom-fichier">{p.cheminDaccesDossier}</span>
                                                <span className="partage-email">Vers : {p.emailContact || 'Utilisateur inconnu'}</span>
                                            </div>
                                        </div>
                                        <div className="partage-element-lateral">
                                            <span className="partage-date-fichier">Envoyé le {new Date(p.dateCreation).toLocaleDateString()}</span>
                                            <button className="partage-bouton-danger-contour" onClick={(e) => { e.stopPropagation(); resilierPartageInterne(p.idDossier); }}>Révoquer</button>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    <div className="partage-panneau-donnees partage-pleine-largeur">
                        <div className="partage-en-tete-description">
                            <h3>Liens publics (Invités)</h3>
                            <p>Cliquez sur un élément pour copier le lien dans votre presse-papier.</p>
                        </div>
                        <div className="partage-liste-large">
                            {liensPublics.length === 0 ? <div className="partage-etat-vide">Aucun lien généré.</div> : 
                                liensPublics.map(l => (
                                    <div key={l.idLien} className="partage-element-liste cliquable" onClick={() => copierLien(l.url)} title="Cliquez pour copier le lien">
                                        <div className="partage-element-principal">
                                            <span className="partage-icone-fichier" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                                {l.type === 'dossier' ? <Link2 size={22} /> : <File size={22} />}
                                            </span>
                                            <div className="partage-infos-texte">
                                                <div className="partage-nom-ligne">
                                                    <span className="partage-nom-fichier">{l.nom}</span>
                                                    <span className={`partage-etiquette-statut ${l.protege ? 'partage-etiquette-protege' : 'partage-etiquette-public'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        {l.protege ? <Lock size={12} /> : <Unlock size={12} />}
                                                        {l.protege ? 'Protégé' : 'Public'}
                                                    </span>
                                                </div>
                                                <span className="partage-email">
                                                    Expire le : {l.dateExpiration ? new Date(l.dateExpiration).toLocaleDateString() : 'Jamais'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="partage-element-lateral">
                                            <span className="partage-date-fichier">Créé le {new Date(l.createdAt).toLocaleDateString()}</span>
                                            <button className="partage-bouton-danger-contour" onClick={(e) => { e.stopPropagation(); supprimerLienPublic(l.idLien); }}>
                                                <Trash2 size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                                Supprimer
                                            </button>
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