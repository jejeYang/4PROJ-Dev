import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../styles/Lien.css';

const Lien = () => {
    const { token } = useParams();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [password, setPassword] = useState('');
    const [passwordRequired, setPasswordRequired] = useState(false);
    const [currentFolderId, setCurrentFolderId] = useState(null);

    const fetchDetails = async (pass = '', folderId = null) => {
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
            if (response.data.type === 'dossier') {
                setCurrentFolderId(response.data.idDossier);
            }
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setPasswordRequired(true);
                if (pass) setError('Mot de passe incorrect.');
            } else {
                setError(err.response?.data?.error || 'Erreur lors de la récupération des détails.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [token]);

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        fetchDetails(password);
    };

    const handleAction = (fileName = null, folderId = null, download = false) => {
        const idToUse = folderId || (details.type === 'dossier' ? details.idDossier : null);
        const nameToUse = fileName || (details.type === 'fichier' ? details.nom : null);
        
        let url = `http://localhost:3000/api/liens/${token}?password=${encodeURIComponent(password)}`;
        if (idToUse) url += `&idDossier=${idToUse}`;
        if (nameToUse) url += `&fileName=${encodeURIComponent(nameToUse)}`;
        if (download) url += `&download=true`;
        
        window.open(url, '_blank');
    };

    const navigateToFolder = (folderId) => {
        fetchDetails(password, folderId);
    };

    const getFileIcon = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        const types = {
            images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
            videos: ['mp4', 'webm'],
            audio: ['mp3', 'wav', 'm4a', 'ogg'],
            pdf: ['pdf'],
            zip: ['zip', 'rar', '7z', 'tar', 'gz'],
        };
        if (types.images.includes(ext)) return '🖼️';
        if (types.videos.includes(ext)) return '🎥';
        if (types.audio.includes(ext)) return '🎵';
        if (types.pdf.includes(ext)) return '📄';
        if (types.zip.includes(ext)) return '📦';
        return '📄';
    };

    if (loading && !details) {
        return <div className="partage-container"><div className="spinner-recherche-grand"></div></div>;
    }

    if (passwordRequired) {
        return (
            <div className="partage-container">
                <div className="partage-card auth-card">
                    <h2>Lien protégé</h2>
                    <p>Ce lien est protégé par un mot de passe.</p>
                    <form onSubmit={handlePasswordSubmit}>
                        <input
                            type="password"
                            placeholder="Mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="submit" className="btn-primary">Accéder</button>
                    </form>
                    {error && <p className="error-message">{error}</p>}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="partage-container">
                <div className="partage-card error-card">
                    <h2>Erreur</h2>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className="btn-secondary">Réessayer</button>
                </div>
            </div>
        );
    }

    if (!details) return null;

    return (
        <div className="partage-guest-dashboard">
            <header className="guest-header">
                <div className="header-info">
                    <h1>{details.nom}</h1>
                    <span className="badge-guest">Mode Invité</span>
                </div>
                <div className="header-actions">
                    <button onClick={() => handleAction(null, null, true)} className="btn-download-main">
                        {details.type === 'dossier' ? 'Télécharger tout (ZIP)' : 'Télécharger'}
                    </button>
                </div>
            </header>

            <main className="guest-main">
                <div className="guest-content-card">
                    {details.type === 'dossier' && (
                        <div className="guest-navigation">
                            {!details.isRacinePartage && (
                                <button className="btn-back" onClick={() => navigateToFolder(details.idDossierParent)}>
                                    ⬅ Dossier parent
                                </button>
                            )}
                            <div className="current-path">
                                Contenu de : <strong>{details.nom}</strong>
                            </div>
                        </div>
                    )}

                    <div className="guest-items-table">
                        <div className="table-header">
                            <div className="col-icon"></div>
                            <div className="col-name">Nom</div>
                            <div className="col-size">Taille</div>
                            <div className="col-actions">Actions</div>
                        </div>

                        {details.type === 'fichier' && !currentFolderId ? (
                            <div className="table-row">
                                <div className="col-icon">{getFileIcon(details.nom)}</div>
                                <div className="col-name">{details.nom}</div>
                                <div className="col-size">{(details.taille / 1024 / 1024).toFixed(2)} Mo</div>
                                <div className="col-actions">
                                    <button onClick={() => handleAction()} title="Consulter">👁️</button>
                                    <button onClick={() => handleAction(null, null, true)} title="Télécharger">⬇️</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {details.sousDossiers?.map(folder => (
                                    <div key={folder.idDossier} className="table-row folder-row" onClick={() => navigateToFolder(folder.idDossier)}>
                                        <div className="col-icon">📁</div>
                                        <div className="col-name">{folder.cheminDaccesDossier}</div>
                                        <div className="col-size">--</div>
                                        <div className="col-actions">
                                            <button onClick={(e) => { e.stopPropagation(); handleAction(null, folder.idDossier, true); }} title="Télécharger ZIP">⬇️</button>
                                        </div>
                                    </div>
                                ))}
                                {details.fichiers?.map(file => (
                                    <div key={file.nom} className="table-row">
                                        <div className="col-icon">{getFileIcon(file.nom)}</div>
                                        <div className="col-name">{file.nom}</div>
                                        <div className="col-size">{(file.taille / 1024 / 1024).toFixed(2)} Mo</div>
                                        <div className="col-actions">
                                            <button onClick={() => handleAction(file.nom)} title="Consulter">👁️</button>
                                            <button onClick={() => handleAction(file.nom, null, true)} title="Télécharger">⬇️</button>
                                        </div>
                                    </div>
                                ))}
                                {(!details.sousDossiers?.length && !details.fichiers?.length) && (
                                    <div className="empty-message">Ce dossier est vide.</div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Lien;