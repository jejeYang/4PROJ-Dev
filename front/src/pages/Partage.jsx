import React from 'react';
import { useVoirPartage } from '../hooks/useVoirPartage';
import '../styles/Partage.css';

function Partage() {
    const { 
        liensPublics, partagesEnvoyes, partagesRecus, 
        chargement, erreur, setErreur, 
        supprimerLienPublic, resilierPartageInterne 
    } = useVoirPartage();

    if (chargement) return <div className="partage-container"><span className="spinner-recherche-grand" /></div>;

    return (
        <div className="partage-container">
            <h1>Gestion des partages</h1>

            {erreur && <div className="partage-erreur-globale">{erreur} <button onClick={() => setErreur('')}>✕</button></div>}

            <section className="partage-section">
                <h2>Partages reçus</h2>
                <p className="subtitle">Dossiers partagés par d'autres utilisateurs avec vous.</p>
                <div className="partage-liste">
                    {partagesRecus.length === 0 ? <p className="vide">Aucun dossier reçu.</p> : 
                        partagesRecus.map(p => (
                            <div key={p.idDossier} className="partage-ligne">
                                <div className="col-nom">📁 {p.cheminDaccesDossier}</div>
                                <div className="col-date">Reçu le {new Date(p.dateCreation).toLocaleDateString()}</div>
                                <div className="col-actions">
                                    <button className="action-icon-btn action-danger" onClick={() => resilierPartageInterne(p.idDossier)}>Quitter le partage</button>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </section>

            <section className="partage-section">
                <h2>Partages envoyés</h2>
                <p className="subtitle">Dossiers que vous avez partagés avec d'autres comptes.</p>
                <div className="partage-liste">
                    {partagesEnvoyes.length === 0 ? <p className="vide">Aucun partage envoyé.</p> : 
                        partagesEnvoyes.map(p => (
                            <div key={p.idDossier} className="partage-ligne">
                                <div className="col-nom">📁 {p.cheminDaccesDossier}</div>
                                <div className="col-date">Envoyé le {new Date(p.dateCreation).toLocaleDateString()}</div>
                                <div className="col-actions">
                                    <button className="action-icon-btn action-danger" onClick={() => resilierPartageInterne(p.idDossier)}>Révoquer l'accès</button>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </section>

            <section className="partage-section">
                <h2>Liens publics (Invités)</h2>
                <p className="subtitle">Liens actifs accessibles par mot de passe.</p>
                <div className="partage-liste">
                    {liensPublics.length === 0 ? <p className="vide">Aucun lien généré.</p> : 
                        liensPublics.map(l => (
                            <div key={l.idLien} className="partage-ligne">
                                <div className="col-nom">{l.type === 'dossier' ? '📁' : '📄'} {l.nom}</div>
                                <div className="col-protection">{l.protege ? '🔒 Protégé' : '🔓 Public'}</div>
                                <div className="col-actions">
                                    <button className="action-icon-btn action-danger" onClick={() => supprimerLienPublic(l.idLien)}>Supprimer</button>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </section>
        </div>
    );
}

export default Partage;