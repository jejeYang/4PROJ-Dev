import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css';

function Dashboard() {
    const [dossiers, setDossiers] = useState([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Mon Espace</h1>
                <Link to="/upload" className="btn-primary">
                    <span className="icon">+</span> Uploader un fichier
                </Link>
            </div>

            <div className="dossiers-section">
                <h2>Mes dossiers</h2>
                {dossiers.length === 0 ? (
                    <div className="empty-state">
                        <p>Aucun dossier pour le moment</p>
                        <p className="hint">Veuillez créer un dossier via l'API pour commencer</p>
                    </div>
                ) : (
                    <div className="dossiers-grid">
                        {dossiers.map((dossier) => (
                            <div key={dossier.iddossier} className="dossier-card">
                                <div className="dossier-icon">📁</div>
                                <h3>{dossier.chemindaccesdossier}</h3>
                                <p className="dossier-id">ID: {dossier.iddossier}</p>
                                <div className="dossier-actions">
                                    <Link to="/upload" className="action-btn upload">
                                        Uploader
                                    </Link>
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
