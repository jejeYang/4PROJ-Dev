import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { formatFileSize, obtenirTypeFichier, tronquerNom, separerNomExtension, obtenirEmojiFichier } from '../utils/fichierUtils';
import '../styles/Dashboard.css';

const Lien = () => {
    const { token } = useParams();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Auth & Navigation
    const [password, setPassword] = useState('');
    const [passwordRequired, setPasswordRequired] = useState(false);
    const [nomRacine, setNomRacine] = useState('');
    const [fil_ariane, setFilAriane] = useState([]); // [{id, nom}]
    
    // Aperçu
    const [fichier_preview, setFichierPreview] = useState(null);

    const fetchDetails = async (pass = password, folderId = null) => {
        setLoading(true);
        setError('');
        try {
            const config = {
                params: folderId ? { idSousDossier: folderId } : {},
                headers: pass ? { 'x-lien-password': pass } : {}
            };
            const response = await axios.get(`http://localhost:3000/api/liens/${token}/details`, config);
            
            setDetails(response.data);
            setPasswordRequired(false);
            
            if (response.data.isRacinePartage) {
                setNomRacine(response.data.nom);
            }
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setPasswordRequired(true);
                if (pass) setError('Mot de passe incorrect.');
            } else {
                setError(err.response?.data?.error || 'Erreur lors de la récupération du lien.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
        // eslint-disable-next-line
    }, [token]);

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        fetchDetails(password);
    };

    const naviguerVersDossier = (dossierId, nomDossier) => {
        setFilAriane([...fil_ariane, { id: dossierId, nom: nomDossier }]);
        fetchDetails(password, dossierId);
    };

    const gestionClicBreadcrumb = (index) => {
        if (index === -1) {
            setFilAriane([]);
            fetchDetails(password, null);
        } else {
            const nouveauFil = fil_ariane.slice(0, index + 1);
            setFilAriane(nouveauFil);
            fetchDetails(password, nouveauFil[index].id);
        }
    };

    const ouvrirApercu = (fichier) => {
        const type = obtenirTypeFichier(fichier.nom);
        if (type === 'inconnu') return;
        
        const url = `http://localhost:3000/api/liens/${token}?password=${encodeURIComponent(password)}&idDossier=${details.idDossier}&fileName=${encodeURIComponent(fichier.nom)}`;
        setFichierPreview({ nom: fichier.nom, url, type });
    };

    const telechargerFichier = (fichier) => {
        const url = `http://localhost:3000/api/liens/${token}?password=${encodeURIComponent(password)}&idDossier=${details.idDossier}&fileName=${encodeURIComponent(fichier.nom)}&download=true`;
        window.open(url, '_blank');
    };

    const telechargerDossier = (dossierId = details.idDossier) => {
        const url = `http://localhost:3000/api/liens/${token}?password=${encodeURIComponent(password)}&idDossier=${dossierId}&download=true`;
        window.open(url, '_blank');
    };

    // Vues conditionnelles
    if (loading && !details) {
        return <div className="dashboard-container"><div className="div-chargement">Chargement du partage...</div></div>;
    }

    if (passwordRequired) {
        return (
            <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="modal-contenu" style={{ maxWidth: '400px', width: '100%' }}>
                    <h3>🔒 Lien protégé</h3>
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
                                    <span className="breadcrumb-separateur">›</span>
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

                        {/* PARTIE : SOUS-DOSSIERS */}
                        {details.sousDossiers?.map((dossier) => (
                            <div key={dossier.idDossier} className="dossier-ligne" onClick={() => naviguerVersDossier(dossier.idDossier, dossier.cheminDaccesDossier)}>
                                <div className="col-checkbox" style={{ width: '20px' }}></div>
                                <div className="col-nom">
                                    <span>📁</span>
                                    <span className="dossier-nom" title={dossier.cheminDaccesDossier}>
                                        {tronquerNom(dossier.cheminDaccesDossier)}
                                    </span>
                                </div>
                                <div className="col-extension">dossier</div>
                                <div className="col-date">-</div>
                                <div className="col-date">-</div>
                                <div className="col-taille">...</div>
                                <div className="col-actions">
                                    <button className="action-icon-btn action-primary" onClick={(e) => { e.stopPropagation(); telechargerDossier(dossier.idDossier); }} title="Télécharger ZIP">⬇️</button>
                                </div>
                            </div>
                        ))}

                        {/* PARTIE : FICHIERS */}
                        {details.fichiers?.map((fichier) => {
                            const { nomBase, extension } = separerNomExtension(fichier.nom);
                            return (
                                <div key={fichier.nom} className="dossier-ligne fichier-ligne" onClick={() => ouvrirApercu(fichier)}>
                                    <div className="col-checkbox" style={{ width: '20px' }}></div>
                                    <div className="col-nom">
                                        <span>{obtenirEmojiFichier(fichier.nom)}</span>
                                        <span className="dossier-nom" title={fichier.nom}>
                                            {tronquerNom(nomBase)}
                                        </span>
                                    </div>
                                    <div className="col-extension">{extension || 'fichier'}</div>
                                    <div className="col-date">{fichier.dateModification ? new Date(fichier.dateModification).toLocaleDateString('fr-FR') : '-'}</div>
                                    <div className="col-taille">{formatFileSize(fichier.taille)}</div>
                                    <div className="col-actions">
                                        <button className="action-icon-btn action-primary" onClick={(e) => { e.stopPropagation(); telechargerFichier(fichier); }} title="Télécharger">⬇️</button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* PARTIE : FICHIER UNIQUE (Partage direct de fichier) */}
                        {details.type === 'fichier' && (
                             <div className="dossier-ligne fichier-ligne" onClick={() => ouvrirApercu(details)}>
                                <div className="col-checkbox" style={{ width: '20px' }}></div>
                                <div className="col-nom">
                                    <span>{obtenirEmojiFichier(details.nom)}</span>
                                    <span className="dossier-nom" title={details.nom}>
                                        {tronquerNom(separerNomExtension(details.nom).nomBase)}
                                    </span>
                                </div>
                                <div className="col-extension">{separerNomExtension(details.nom).extension || 'fichier'}</div>
                                <div className="col-date">{details.dateModification ? new Date(details.dateModification).toLocaleDateString('fr-FR') : '-'}</div>
                                <div className="col-taille">{formatFileSize(details.taille)}</div>
                                <div className="col-actions">
                                    <button className="action-icon-btn action-primary" onClick={(e) => { e.stopPropagation(); telechargerFichier(details); }} title="Télécharger">⬇️</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MODALE D'APERÇU */}
            {fichier_preview && (
                <div className="modal-overlay" onMouseDown={(e) => {
                    if (e.target === e.currentTarget) setFichierPreview(null);
                }}>
                    <div className="modal-preview-contenu" onClick={e => e.stopPropagation()}>
                        <div className="preview-header">
                            <h3>{fichier_preview.nom}</h3>
                            <button className="btn-fermer-preview" onClick={() => setFichierPreview(null)}>✕</button>
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