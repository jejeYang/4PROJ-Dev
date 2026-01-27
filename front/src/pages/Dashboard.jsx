import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css';

function Dashboard() {
    const [files, setFiles] = useState([]);
    const [storageUsed, setStorageUsed] = useState(0);
    const [storageTotal, setStorageTotal] = useState(100); // GB
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user'));
            
            // Récupérer les fichiers de l'utilisateur
            const filesResponse = await axios.get('http://localhost:3000/api/files', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setFiles(filesResponse.data || []);
            setStorageUsed(user.storagecompte || 0);
        } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
        } finally {
            setLoading(false);
        }
    };

    const storagePercentage = (storageUsed / (storageTotal * 1024 * 1024 * 1024)) * 100;

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const handleDeleteFile = async (fileId) => {
        if (window.confirm('Supprimer ce fichier ?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:3000/api/files/${fileId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchUserData();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
            }
        }
    };

    if (loading) {
        return <div className="dashboard-container">Chargement...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Mon Espace</h1>
                <Link to="/upload" className="btn-primary">
                    <span className="icon">+</span> Uploader un fichier
                </Link>
            </div>

            <div className="dashboard-grid">
                {/* Storage Info */}
                <div className="storage-card">
                    <h2>Espace de stockage</h2>
                    <div className="storage-bar">
                        <div className="storage-used" style={{ width: `${Math.min(storagePercentage, 100)}%` }}></div>
                    </div>
                    <p className="storage-text">
                        {formatFileSize(storageUsed)} / {storageTotal} GB
                    </p>
                </div>

                {/* Stats */}
                <div className="stats-card">
                    <div className="stat">
                        <span className="stat-value">{files.length}</span>
                        <span className="stat-label">Fichiers</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">0</span>
                        <span className="stat-label">Partages</span>
                    </div>
                </div>
            </div>

            {/* Files List */}
            <div className="files-section">
                <h2>Mes fichiers</h2>
                {files.length === 0 ? (
                    <div className="empty-state">
                        <p>Aucun fichier pour le moment</p>
                        <Link to="/upload" className="btn-secondary">
                            Commencer à uploader
                        </Link>
                    </div>
                ) : (
                    <div className="files-table">
                        <div className="table-header">
                            <div className="col-name">Nom</div>
                            <div className="col-size">Taille</div>
                            <div className="col-date">Date</div>
                            <div className="col-actions">Actions</div>
                        </div>
                        {files.map((file) => (
                            <div key={file.id} className="table-row">
                                <div className="col-name">
                                    <span className="file-icon">📄</span>
                                    {file.name}
                                </div>
                                <div className="col-size">{formatFileSize(file.size)}</div>
                                <div className="col-date">{new Date(file.uploadDate).toLocaleDateString()}</div>
                                <div className="col-actions">
                                    <button className="action-btn download" title="Télécharger">⬇</button>
                                    <button className="action-btn share" title="Partager">🔗</button>
                                    <button 
                                        className="action-btn delete" 
                                        title="Supprimer"
                                        onClick={() => handleDeleteFile(file.id)}
                                    >
                                        🗑
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
