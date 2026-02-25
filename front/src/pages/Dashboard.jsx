import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css';

function Dashboard() {
    const [dossiers, setDossiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    
    // États pour la navigation dans les dossiers
    const [currentFolder, setCurrentFolder] = useState(null);
    const [folderContents, setFolderContents] = useState([]);
    const [breadcrumb, setBreadcrumb] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user'));
            
            // Récupérer les dossiers de l'utilisateur
            const response = await axios.get(
                `http://localhost:3000/api/comptes/${user.id}/dossiers`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setDossiers(response.data || []);
        } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFolderDoubleClick = async (dossier) => {
        try {
            const token = localStorage.getItem('token');
            
            // Récupérer les sous-dossiers et les fichiers
            const [dossiersResponse, fichiersResponse] = await Promise.all([
                axios.get(
                    `http://localhost:3000/api/dossiers/${dossier.idDossier}/sous-dossiers`,
                    { headers: { Authorization: `Bearer ${token}` } }
                ),
                axios.get(
                    `http://localhost:3000/api/dossiers/${dossier.idDossier}/fichiers`,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
            ]);
            
            setCurrentFolder(dossier);
            setFolderContents({
                dossiers: dossiersResponse.data || [],
                fichiers: fichiersResponse.data || []
            });
            setBreadcrumb([...breadcrumb, dossier]);
        } catch (error) {
            console.error('Erreur lors de la récupération du contenu du dossier:', error);
            setError('Erreur lors de l\'ouverture du dossier');
        }
    };

    const handleBackToParent = () => {
        const newBreadcrumb = breadcrumb.slice(0, -1);
        setBreadcrumb(newBreadcrumb);
        
        if (newBreadcrumb.length === 0) {
            setCurrentFolder(null);
            setFolderContents([]);
        } else {
            const parentFolder = newBreadcrumb[newBreadcrumb.length - 1];
            setCurrentFolder(parentFolder);
        }
    };

    const handleBreadcrumbClick = async (index) => {
        try {
            const token = localStorage.getItem('token');
            
            if (index === -1) {
                // Clic sur "Mon Espace" - retour à la racine
                setCurrentFolder(null);
                setFolderContents([]);
                setBreadcrumb([]);
            } else {
                // Clic sur un dossier du breadcrumb
                const newBreadcrumb = breadcrumb.slice(0, index + 1);
                const selectedFolder = newBreadcrumb[index];
                
                // Charger le contenu du dossier sélectionné
                const [dossiersResponse, fichiersResponse] = await Promise.all([
                    axios.get(
                        `http://localhost:3000/api/dossiers/${selectedFolder.idDossier}/sous-dossiers`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    ),
                    axios.get(
                        `http://localhost:3000/api/dossiers/${selectedFolder.idDossier}/fichiers`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    )
                ]);
                
                setBreadcrumb(newBreadcrumb);
                setCurrentFolder(selectedFolder);
                setFolderContents({
                    dossiers: dossiersResponse.data || [],
                    fichiers: fichiersResponse.data || []
                });
            }
        } catch (error) {
            console.error('Erreur lors de la navigation:', error);
            setError('Erreur lors de la navigation');
        }
    };

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        
        if (!newFolderName.trim()) {
            setError('Le nom du dossier ne peut pas être vide');
            return;
        }

        setCreating(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            
            const response = await axios.post(
                'http://localhost:3000/api/dossiers',
                {
                    cheminDaccesDossier: newFolderName.trim(),
                    idDossierParent: currentFolder ? currentFolder.idDossier : null
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Ajouter le nouveau dossier à la liste appropriée
            if (currentFolder) {
                setFolderContents({
                    ...folderContents,
                    dossiers: [...folderContents.dossiers, response.data]
                });
            } else {
                setDossiers([...dossiers, response.data]);
            }
            
            setNewFolderName('');
            setShowCreateFolder(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors de la création du dossier');
            console.error('Erreur:', err);
        } finally {
            setCreating(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    if (loading) {
        return <div className="dashboard-container">Chargement...</div>;
    }

    // Afficher le contenu du dossier actuel
    const displayItems = currentFolder ? {
        dossiers: folderContents.dossiers || [],
        fichiers: folderContents.fichiers || []
    } : {
        dossiers: dossiers,
        fichiers: []
    };

    const allItems = [...displayItems.dossiers, ...displayItems.fichiers];

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>Mon Espace</h1>
                    {breadcrumb.length > 0 && (
                        <nav className="breadcrumb">
                            <button 
                                className="breadcrumb-item"
                                onClick={() => handleBreadcrumbClick(-1)}
                            >
                                📁 Mon Espace
                            </button>
                            {breadcrumb.map((dossier, index) => (
                                <React.Fragment key={dossier.idDossier}>
                                    <span className="breadcrumb-separator">/</span>
                                    <button 
                                        className="breadcrumb-item"
                                        onClick={() => handleBreadcrumbClick(index)}
                                    >
                                        {dossier.cheminDaccesDossier}
                                    </button>
                                </React.Fragment>
                            ))}
                        </nav>
                    )}
                </div>
                <div className="header-actions">
                    <Link to="/upload" className="btn-primary">
                        <span className="icon">+</span> Uploader un fichier
                    </Link>
                    <button 
                        className="btn-secondary"
                        onClick={() => setShowCreateFolder(!showCreateFolder)}
                    >
                        <span className="icon">📁</span> Créer un dossier
                    </button>
                </div>
            </div>

            {showCreateFolder && (
                <div className="create-folder-form">
                    <form onSubmit={handleCreateFolder}>
                        <input
                            type="text"
                            placeholder="Nom du dossier"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            disabled={creating}
                        />
                        <button type="submit" disabled={creating}>
                            {creating ? 'Création...' : 'Créer'}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => {
                                setShowCreateFolder(false);
                                setError('');
                                setNewFolderName('');
                            }}
                            disabled={creating}
                        >
                            Annuler
                        </button>
                    </form>
                    {error && <p className="error-message">{error}</p>}
                </div>
            )}

            <div className="dossiers-section">
                <h2>
                    {currentFolder ? `Contenu de ${currentFolder.cheminDaccesDossier}` : 'Mes dossiers'}
                </h2>
                {allItems.length === 0 ? (
                    <div className="empty-state">
                        <p>Aucun dossier ou fichier pour le moment</p>
                        <p className="hint">
                            {currentFolder 
                                ? 'Cliquez sur "Créer un dossier" pour en ajouter un' 
                                : 'Cliquez sur "Créer un dossier" pour commencer'}
                        </p>
                    </div>
                ) : (
                    <div className="dossiers-grid">
                        {displayItems.dossiers.map((dossier) => (
                            <div 
                                key={dossier.idDossier} 
                                className="dossier-card"
                                onDoubleClick={() => handleFolderDoubleClick(dossier)}
                            >
                                <div className="dossier-icon">📁</div>
                                <h3>{dossier.cheminDaccesDossier}</h3>
                                <p className="dossier-id">ID: {dossier.idDossier}</p>
                                <p className="double-click-hint">(Double-clic pour ouvrir)</p>
                                <div className="dossier-actions">
                                    <Link to="/upload" className="action-btn upload">
                                        Uploader
                                    </Link>
                                </div>
                            </div>
                        ))}
                        {displayItems.fichiers.map((fichier, index) => (
                            <div key={`file-${index}`} className="fichier-card">
                                <div className="fichier-icon">📄</div>
                                <h3>{fichier.nom}</h3>
                                <p className="fichier-taille">{formatFileSize(fichier.taille)}</p>
                                <p className="fichier-date">
                                    {new Date(fichier.dateModification).toLocaleDateString('fr-FR')}
                                </p>
                                <div className="fichier-actions">
                                    <button className="action-btn download">
                                        Télécharger
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
