import React from 'react';
import { useLien } from '../hooks/useLien';
import { formatFileSize, tronquerNom, separerNomExtension, obtenirEmojiFichier } from '../utils/fichierUtils';
import { Lock, ChevronRight, Download, X } from 'lucide-react';
import '../styles/Dashboard.css';

const Lien = () => {
    const {
        details, loading, error, 
        password, setPassword, passwordRequired,
        nomRacine, fil_ariane, 
        fichier_preview, setFichierPreview,
        handlePasswordSubmit, naviguerVersDossier, gestionClicBreadcrumb,
        ouvrirApercu, telechargerFichier, telechargerDossier
    } = useLien();

    if (loading && !details) {
        return <div className="dashboard-container"><div className="div-chargement">Chargement du partage...</div></div>;
    }

    if (passwordRequired) {
        return (
            <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="modal-contenu" style={{ maxWidth: '400px', width: '100%' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Lock size={20} />
                        Lien protégé
                    </h3>
                    <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary-color)' }}>Ce partage est protégé par un mot de passe.</p>
                    <form onSubmit={handlePasswordSubmit}>
                        <input
                            type="password"
                            placeholder="Entrez le mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoFocus
                            style={{ width: '100%', padding: '1rem', borderRadius: '15px', border: '1px solid var(--border-color)', marginBottom: '1rem', background: 'var(--bg-primary-color)', color: 'var(--text-primary-color)', fontSize: '1rem' }}
                        />
                        {error && <p className="erreur-modale">{error}</p>}
                        <div className="modal-bouttons" style={{ marginTop: '1rem' }}>
                            <button type="submit" className="btn-confirmer" style={{ width: '100%', padding: '0.8rem' }}>Accéder au contenu</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (error && !details) {
        return (
            <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="page-liste-erreur-globale">
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    if (!details) return null;

    return (
        <div className="dashboard-container" style={{ padding: '2rem' }}>
            
            <div className="page-liste-header">
                <div>
                    <h1>{fil_ariane.length > 0 ? fil_ariane[fil_ariane.length - 1].nom : (details.nom || "Fichier partagé")}</h1>
                    {details.type === 'dossier' && (
                        <nav className="breadcrumb" aria-label="Fil d'arianne">
                            <button className="breadcrumb-objet" onClick={() => gestionClicBreadcrumb(-1)}>{nomRacine}</button>
                            {fil_ariane.map((dossier, index) => (
                                <React.Fragment key={dossier.id}>
                                    <span className="breadcrumb-separateur">
                                        <ChevronRight size={16} />
                                    </span>
                                    <button className="breadcrumb-objet" onClick={() => gestionClicBreadcrumb(index)}>
                                        {dossier.nom}
                                    </button>
                                </React.Fragment>
                            ))}
                        </nav>
                    )}
                </div>
                <div className="page-liste-header-actions">
                    {details.type === 'dossier' ? (
                        <button className="btn-publie-page-liste-header" onClick={() => telechargerDossier()}>
                            Télécharger le dossier en ZIP
                        </button>
                    ) : (
                         <button className="btn-publie-page-liste-header" onClick={() => telechargerFichier(details)}>
                            Télécharger
                        </button>
                    )}
                </div>
            </div>

            <div className="dossiers-section">
                <div className="dossiers-section-header">
                    <h2>Contenu partagé (Lecture seule)</h2>
                </div>

                {(!details.sousDossiers?.length && !details.fichiers?.length && details.type !== 'fichier') ? (
                    <div className="dossier-vide">
                        <p>Ce dossier est vide.</p>
                    </div>
                ) : (
                    <div className="dossiers-liste">
                        <div className="dossier-header-tableau">
                            <div className="col-checkbox" style={{ width: '20px' }}></div>
                            <div className="col-nom">Nom</div>
                            <div className="col-extension">Extension</div>
                            <div className="col-date">Créé le</div>
                            <div className="col-date">Modifié le</div>
                            <div className="col-taille">Taille</div>
                            <div className="col-actions">Actions</div>
                        </div>

                        {details.sousDossiers?.map((dossier) => (
                            <div key={dossier.idDossier} className="dossier-ligne" onClick={() => naviguerVersDossier(dossier.idDossier, dossier.cheminDaccesDossier)}>
                                <div className="col-checkbox" style={{ width: '20px' }}></div>
                                <div className="col-nom">
                                    <span style={{ marginRight: '8px', display: 'inline-flex', alignItems: 'center' }}>📁</span>
                                    <span className="dossier-nom" title={dossier.cheminDaccesDossier}>
                                        {tronquerNom(dossier.cheminDaccesDossier)}
                                    </span>
                                </div>
                                <div className="col-extension">dossier</div>
                                <div className="col-date">-</div>
                                <div className="col-date">-</div>
                                <div className="col-taille">...</div>
                                <div className="col-actions">
                                    <button className="action-icon-btn action-primary" onClick={(e) => { e.stopPropagation(); telechargerDossier(dossier.idDossier); }} title="Télécharger ZIP">
                                        <Download size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {details.fichiers?.map((fichier) => {
                            const { nomBase, extension } = separerNomExtension(fichier.nom);
                            return (
                                <div key={fichier.nom} className="dossier-ligne fichier-ligne" onClick={() => ouvrirApercu(fichier)}>
                                    <div className="col-checkbox" style={{ width: '20px' }}></div>
                                    <div className="col-nom">
                                        {obtenirEmojiFichier(fichier.nom)}
                                        <span className="dossier-nom" title={fichier.nom}>
                                            {tronquerNom(nomBase)}
                                        </span>
                                    </div>
                                    <div className="col-extension">{extension || 'fichier'}</div>
                                    <div className="col-date">{fichier.dateModification ? new Date(fichier.dateModification).toLocaleDateString('fr-FR') : '-'}</div>
                                    <div className="col-taille">{formatFileSize(fichier.taille)}</div>
                                    <div className="col-actions">
                                        <button className="action-icon-btn action-primary" onClick={(e) => { e.stopPropagation(); telechargerFichier(fichier); }} title="Télécharger">
                                            <Download size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {details.type === 'fichier' && (
                             <div className="dossier-ligne fichier-ligne" onClick={() => ouvrirApercu(details)}>
                                <div className="col-checkbox" style={{ width: '20px' }}></div>
                                <div className="col-nom">
                                    {obtenirEmojiFichier(details.nom)}
                                    <span className="dossier-nom" title={details.nom}>
                                        {tronquerNom(separerNomExtension(details.nom).nomBase)}
                                    </span>
                                </div>
                                <div className="col-extension">{separerNomExtension(details.nom).extension || 'fichier'}</div>
                                <div className="col-date">{details.dateModification ? new Date(details.dateModification).toLocaleDateString('fr-FR') : '-'}</div>
                                <div className="col-taille">{formatFileSize(details.taille)}</div>
                                <div className="col-actions">
                                    <button className="action-icon-btn action-primary" onClick={(e) => { e.stopPropagation(); telechargerFichier(details); }} title="Télécharger">
                                        <Download size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {fichier_preview && (
                <div className="modal-overlay" onMouseDown={(e) => {
                    if (e.target === e.currentTarget) setFichierPreview(null);
                }}>
                    <div className="modal-preview-contenu" onClick={e => e.stopPropagation()}>
                        <div className="preview-header">
                            <h3>{fichier_preview.nom}</h3>
                            <button className="btn-fermer-preview" onClick={() => setFichierPreview(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="preview-body">
                            {fichier_preview.type === 'image' && <img src={fichier_preview.url} alt={fichier_preview.nom} />}
                            {fichier_preview.type === 'video' && <video controls autoPlay src={fichier_preview.url} />}
                            {fichier_preview.type === 'audio' && <audio controls autoPlay src={fichier_preview.url} />}
                            {fichier_preview.type === 'document' && <iframe src={fichier_preview.url} title={fichier_preview.nom} />}
                            {fichier_preview.type === 'non_supporte' && <div>L'affichage de ce type de fichier n'est pas supporté. Veuillez le télécharger.</div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Lien;