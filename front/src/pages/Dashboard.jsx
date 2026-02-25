import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css';

function Dashboard() {
    const [dossiers, setDossiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [menu_nom_dossier, setChangeNomDossier] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    
    // États pour la navigation dans les dossiers
    const [dossier_actuel, setDossierActuel] = useState(null);
    const [contenu_dossier, setContenuDossier] = useState([]);
    const [fil_ariane, setFilAriane] = useState([]);
    const [taille_dossiers, setTailleDossiers] = useState({});
    const [menu_options_dossier, setMenuOptionsDossier] = useState(null);
    const navigate = useNavigate();

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

    // Récupère la taille des dossiers
    useEffect(() => {
        const recupereTaille = async (list) => {
            if (!list || list.length === 0) return;
            const token = localStorage.getItem('token');
            const promises = list.map(async (dossier) => {
                if (!dossier || taille_dossiers[dossier.iddossier] !== undefined) return null;
                try {
                    const res = await axios.get(
                        `http://localhost:3000/api/dossiers/${dossier.iddossier}/fichiers`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const sum = (res.data || []).reduce((acc, f) => acc + (f.taille || 0), 0);
                    return { id: dossier.iddossier, size: sum };
                } catch (err) {
                    alert('Erreur :'+err);
                    return { id: dossier.iddossier, size: 0 };
                }
            });

            const resultat = await Promise.all(promises);
            const updates = {};
            resultat.forEach(r => { if (r) updates[r.id] = r.size; });
            if (Object.keys(updates).length > 0) setTailleDossiers(prev => ({ ...prev, ...updates }));
        };

        recupereTaille(dossiers);
        if (contenu_dossier && contenu_dossier.dossiers) recupereTaille(contenu_dossier.dossiers);
    }, [dossiers, contenu_dossier, taille_dossiers]);
    

    // Accede au dossier et récupère son contenu (sous-dossiers + fichiers)
    const gestionClicDossier = async (dossier) => {
        try {
            const token = localStorage.getItem('token');
            
            // Récupérer les sous-dossiers et les fichiers
            const [dossiersResponse, fichiersResponse] = await Promise.all([
                axios.get(
                    `http://localhost:3000/api/dossiers/${dossier.iddossier}/sous-dossiers`,
                    { headers: { Authorization: `Bearer ${token}` } }
                ),
                axios.get(
                    `http://localhost:3000/api/dossiers/${dossier.iddossier}/fichiers`,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
            ]);
            
            setDossierActuel(dossier);
            setContenuDossier({
                dossiers: dossiersResponse.data || [],
                fichiers: fichiersResponse.data || []
            });
            setFilAriane([...fil_ariane, dossier]);
        } catch (error) {
            console.error('Erreur lors de la récupération du contenu du dossier:', error);
            setError('Erreur lors de l\'ouverture du dossier');
        }
    };

    // Gère les clics sur le fil d'Ariane pour la navigation
    // breadcrum = fil d'ariane (plus simple a ecrire)
    const gestionClicBreadcrumb = async (index) => {
        try {
            const token = localStorage.getItem('token');
            
            if (index === -1) {
                // Clic sur "Mon Espace" - retour à la racine
                setDossierActuel(null);
                setContenuDossier([]);
                setFilAriane([]);
            } else {
                // Clic sur un dossier du fil d'Ariane
                const newBreadcrumb = fil_ariane.slice(0, index + 1);
                const selectedFolder = newBreadcrumb[index];
                
                // Charger le contenu du dossier sélectionné
                const [dossiersResponse, fichiersResponse] = await Promise.all([
                    axios.get(
                        `http://localhost:3000/api/dossiers/${selectedFolder.iddossier}/sous-dossiers`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    ),
                    axios.get(
                        `http://localhost:3000/api/dossiers/${selectedFolder.iddossier}/fichiers`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    )
                ]);
                
                setFilAriane(newBreadcrumb);
                setDossierActuel(selectedFolder);
                setContenuDossier({
                    dossiers: dossiersResponse.data || [],
                    fichiers: fichiersResponse.data || []
                });
            }
        } catch (error) {
            console.error('Erreur lors de la navigation:', error);
            setError('Erreur lors de la navigation');
        }
    };

    const gestionCreeDossier = async (e) => {
        e.preventDefault();
        
        if (!menu_nom_dossier.trim()) {
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
                    cheminDaccesDossier: menu_nom_dossier.trim(),
                    idDossierParent: dossier_actuel ? dossier_actuel.iddossier : null
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Ajouter le nouveau dossier à la liste appropriée
            if (dossier_actuel) {
                setContenuDossier({
                    ...contenu_dossier,
                    dossiers: [...contenu_dossier.dossiers, response.data]
                });
            } else {
                setDossiers([...dossiers, response.data]);
            }
            
            setChangeNomDossier('');
            setShowCreateFolder(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors de la création du dossier');
            console.error('Erreur:', err);
        } finally {
            setCreating(false);
        }
    };

    const gestionRenommeDossier = async (dossier) => {
        const newName = window.prompt('Nouveau nom du dossier', dossier.chemindaccesdossier);
        if (!newName || !newName.trim()) return setMenuOptionsDossier(null);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(
                `http://localhost:3000/api/dossiers/${dossier.iddossier}`,
                { cheminDaccesDossier: newName.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Mets à jour
            if (dossier_actuel) {
                setContenuDossier(prev => ({
                    ...prev,
                    dossiers: prev.dossiers.map(d => d.iddossier === dossier.iddossier ? res.data : d)
                }));
            } else {
                setDossiers(prev => prev.map(d => d.iddossier === dossier.iddossier ? res.data : d));
            }
        } catch (err) {
            console.error('Erreur lors du renommage:', err);
            alert('Erreur lors du renommage');
        } finally {
            setMenuOptionsDossier(null);
        }
    };

    const gestionSupprimeDossier = async (dossier) => {
        const ok = window.confirm(`Êtes vous sur que vous voulez supprimer le dossier "${dossier.chemindaccesdossier}" ?`);
        if (!ok) return setMenuOptionsDossier(null);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `http://localhost:3000/api/dossiers/${dossier.iddossier}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (dossier_actuel) {
                setContenuDossier(prev => ({
                    ...prev,
                    dossiers: prev.dossiers.filter(d => d.iddossier !== dossier.iddossier)
                }));
            } else {
                setDossiers(prev => prev.filter(d => d.iddossier !== dossier.iddossier));
            }
        } catch (err) {
            console.error('Erreur lors de la suppression:', err);
            alert('Erreur lors de la suppression');
        } finally {
            setMenuOptionsDossier(null);
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
    const displayItems = dossier_actuel ? {
        dossiers: contenu_dossier.dossiers || [],
        fichiers: contenu_dossier.fichiers || []
    } : {
        dossiers: dossiers,
        fichiers: []
    };

    const allItems = [...displayItems.dossiers, ...displayItems.fichiers];
        // Récupere les dossiers visibles (sauf la corbeille) et la corbeille séparément
        const dossiers_visible = (displayItems.dossiers || []).filter(d => d && !d.chemindaccesdossier.startsWith('.'));
        const corbeille = (displayItems.dossiers || []).find(d => d && d.chemindaccesdossier === '.bin');

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>Mon Espace</h1>
                    {fil_ariane.length > 0 && (
                        <nav className="breadcrumb" aria-label="Fil d'arianne">
                            <button 
                                className="breadcrumb-objet"
                                onClick={() => gestionClicBreadcrumb(-1)}
                            >
                                Mon Espace
                            </button>
                            {fil_ariane.map((dossier, index) => (
                                <React.Fragment key={dossier.iddossier}>
                                    <span className="breadcrumb-separateur">›</span>
                                    <button 
                                        className="breadcrumb-objet"
                                        onClick={() => gestionClicBreadcrumb(index)}
                                    >
                                        {dossier.chemindaccesdossier}
                                    </button>
                                </React.Fragment>
                            ))}
                        </nav>
                    )}
                    </div>
                    <div className={`dashboard-header-actions ${dossier_actuel ? 'in-folder' : ''}`}>
                        <button className="btn-publie-dashboard-header" onClick={() => navigate('/upload')}>
                            Publier un fichier
                        </button>
                        <button className="btn-cree-dossier-dashboard-header" onClick={() => setShowCreateFolder(!showCreateFolder)}
                            aria-pressed={showCreateFolder}
                        >
                            Créer un dossier
                        </button>
                    </div>
            </div>

            {showCreateFolder && (
                <div className="menu-cree-dossier">
                    <form onSubmit={gestionCreeDossier}>
                        <input
                            type="text"
                            placeholder="Nom du dossier"
                            value={menu_nom_dossier}
                            onChange={(e) => setChangeNomDossier(e.target.value)}
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
                                setChangeNomDossier('');
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
                    {dossier_actuel ? `Contenu de ${dossier_actuel.chemindaccesdossier}` : 'Mes dossiers'}
                </h2>
                {allItems.length === 0 ? (
                    <div className="dossier-vide">
                        <p>Aucun dossier ou fichier pour le moment</p>
                        <p className="hint">
                            {dossier_actuel 
                                ? 'Cliquez sur "Créer un dossier" pour en ajouter un' 
                                : 'Cliquez sur "Créer un dossier" pour commencer'}
                        </p>
                    </div>
                ) : (
                    <div className="dossiers-liste">
                        {dossiers_visible.map((dossier) => (
                            <div
                                key={dossier.iddossier}
                                className="dossier-ligne"
                                onClick={() => gestionClicDossier(dossier)}
                            >
                                <div className="col-nom">
                                    <span className="dossier-name">{dossier.chemindaccesdossier}</span>
                                </div>
                                <div className="col-id">ID: {dossier.iddossier}</div>
                                <div className="col-taille">{taille_dossiers[dossier.iddossier] !== undefined ? formatFileSize(taille_dossiers[dossier.iddossier]) : 'Calcul...'}</div>
                                <div className="col-actions">
                                    <button
                                        className="options-btn"
                                        onClick={(e) => { e.stopPropagation(); setMenuOptionsDossier(menu_options_dossier === dossier.iddossier ? null : dossier.iddossier); }}
                                        aria-haspopup="true"
                                        aria-expanded={menu_options_dossier === dossier.iddossier}
                                    >
                                        ⋮
                                    </button>
                                    {menu_options_dossier === dossier.iddossier && (
                                        <div className="options-menu" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => gestionRenommeDossier(dossier)}>Renommer</button>
                                            <button onClick={() => gestionSupprimeDossier(dossier)}>Supprimer</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {displayItems.fichiers.map((fichier, index) => (
                            <div key={`file-${index}`} className="bloc-fichier">
                                <h3>{fichier.nom}</h3>
                                <p className="fichier-taille">{formatFileSize(fichier.taille)}</p>
                                <p className="fichier-date">
                                    {new Date(fichier.dateModification).toLocaleDateString('fr-FR')}
                                </p>
                                <div className="fichier-actions">
                                    <button className="btn-fichier-telecharge">
                                        Télécharger
                                    </button>
                                    <button className="btn-fichier-renomme">
                                        Renommer
                                    </button>
                                    <button className="btn-fichier-supprime">
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {corbeille && (
                <div className="section-corbeille">
                    <h2>Corbeille</h2>
                    <div
                        className="bloc-corbeille"
                        role="button"
                        tabIndex={0}
                        onClick={() => gestionClicDossier(corbeille)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') gestionClicDossier(corbeille); }}
                        aria-label="Ouvrir la corbeille"
                    >
                        <div className="trash-icon">🗑️</div>
                        <h3>Corbeille</h3>
                        <p className="taille-dossier">{taille_dossiers[corbeille.iddossier] !== undefined ? formatFileSize(taille_dossiers[corbeille.iddossier]) : 'Calcul...'}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
