import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Upload.css';

function Upload() {
    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dossiers, setDossiers] = useState([]);
    const [dossierId, setDossierId] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchDossiers();
    }, []);

    const fetchDossiers = async () => {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user'));
            
            const response = await axios.get(
                `http://localhost:3000/api/comptes/${user.id}/dossiers`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setDossiers(response.data || []);
            if (response.data && response.data.length > 0) {
                setDossierId(response.data[0].idDossier);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des dossiers:', error);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (files.length === 0) {
            alert('Veuillez sélectionner au moins un fichier');
            return;
        }
        if (!dossierId) {
            alert('Veuillez d\'abord créer ou sélectionner un dossier');
            return;
        }

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            
            files.forEach(file => {
                formData.append('fichiers', file);
            });

            const response = await axios.post(
                `http://localhost:3000/api/dossiers/${dossierId}/televerser-multiple`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            alert('Fichiers uploadés avec succès !');
            setFiles([]);
            navigate('/dashboard');
        } catch (error) {
            alert('Erreur lors de l\'upload : ' + (error.response?.data?.error || error.message));
        } finally {
            setUploading(false);
        }
    };

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    return (
        <div className="upload-container">
            <div className="upload-card">
                <h2>Uploader des fichiers</h2>
                
                <form onSubmit={handleUpload}>
                    {dossiers.length === 0 ? (
                        <div className="no-folder">
                            <p>⚠️ Vous n'avez pas de dossier. Veuillez en créer un d'abord.</p>
                        </div>
                    ) : (
                        <>
                            <div className="form-group">
                                <label>Sélectionner un dossier</label>
                                <select 
                                    value={dossierId} 
                                    onChange={(e) => setDossierId(e.target.value)}
                                    className="folder-select"
                                >
                                    <option value="">-- Choisir un dossier --</option>
                                    {dossiers.map((dossier) => (
                                        <option key={dossier.idDossier} value={dossier.idDossier}>
                                            {dossier.cheminDaccesDossier}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div 
                                className={`drag-drop-area ${dragActive ? 'active' : ''}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <div className="drag-drop-content">
                                    <span className="upload-icon">📁</span>
                                    <p>Glissez vos fichiers ici ou</p>
                                    <label htmlFor="file-input" className="file-label">
                                        cliquez pour parcourir
                                    </label>
                                    <input
                                        id="file-input"
                                        type="file"
                                        multiple
                                        onChange={handleChange}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>

                            {files.length > 0 && (
                                <div className="file-list">
                                    <h3>Fichiers à uploader ({files.length})</h3>
                                    {files.map((file, index) => (
                                        <div key={index} className="file-item">
                                            <span className="file-name">{file.name}</span>
                                            <span className="file-size">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="remove-btn"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button 
                                type="submit" 
                                className="btn-upload-submit"
                                disabled={files.length === 0 || uploading}
                            >
                                {uploading ? 'Upload en cours...' : 'Uploader'}
                            </button>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}

export default Upload;
