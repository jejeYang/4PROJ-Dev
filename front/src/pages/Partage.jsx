import React from 'react';
import { useVoirPartage } from '../hooks/useVoirPartage';
import '../styles/Partage.css';

function Partage() {
    const { liensPartage, chargementEnCours, erreur, setErreur, supprimerLien } = useVoirPartage();

    const formaterDate = (dateString) => {
        if (!dateString) return "Jamais";
        const dateObj = new Date(dateString);
        return dateObj.toLocaleDateString('fr-FR', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (chargementEnCours) {
        return (
            <div className="partage-container">
                <div className="partage-vide">
                    <span className="spinner-recherche-grand" />
                </div>
            </div>
        );
    }

    return (
        <div className="partage-container">
            <div className="partage-header">
                <h1>Mes partages</h1>
                <p>Gérez vos liens d'invitation et vos fichiers partagés.</p>
            </div>

            {erreur && (
                <div className="partage-erreur-globale">
                    <span>{erreur}</span>
                    <button className="btn-fermer-erreur" onClick={() => setErreur('')} title="Fermer">✕</button>
                </div>
            )}

            {liensPartage.length === 0 ? (
                <div className="partage-vide">
                    <p>Vous n'avez aucun lien de partage actif pour le moment.</p>
                </div>
            ) : (
                <div className="partage-liste">
                    <div className="partage-header-tableau">
                        <div className="col-nom">Élément partagé</div>
                        <div className="col-type">Type</div>
                        <div className="col-date">Création</div>
                        <div className="col-date">Expiration</div>
                        <div className="col-protection">Protection</div>
                        <div className="col-actions">Actions</div>
                    </div>

                    {/* Lignes */}
                    {liensPartage.map((lien) => (
                        <div key={lien.idLien} className="partage-ligne">
                            <div className="col-nom">
                                <span className="partage-emoji">{lien.type === 'dossier' ? '📁' : '📄'}</span>
                                <span className="partage-nom" title={lien.nom}>{lien.nom}</span>
                            </div>
                            <div className="col-type">{lien.type === 'dossier' ? 'Dossier' : 'Fichier'}</div>
                            <div className="col-date">{formaterDate(lien.createdAt)}</div>
                            <div className="col-date">{formaterDate(lien.dateExpiration)}</div>
                            <div className="col-protection">
                                {lien.protege ? (
                                    <span className="tag-protege">🔒 Mdp requis</span>
                                ) : (
                                    <span className="tag-public">🔓 Public</span>
                                )}
                            </div>
                            <div className="col-actions">
                                <button 
                                    className="action-icon-btn action-danger"
                                    onClick={() => supprimerLien(lien.idLien)}
                                    title="Supprimer le lien"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Partage;