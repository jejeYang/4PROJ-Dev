import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css';

function Dashboard() {
    const [dossiers, setDossiers] = useState([]);
    const [etat_survole_upload, setEtatSurvoleUpload] = useState(false);
    const [dossier_survole_upload, setDossierSurvoleUpload] = useState(null);
    const compteur_drag = useRef(0);

    const [loading, setLoading] = useState(true);
    const [menu_nom_dossier, setChangeNomDossier] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [ouvre_modal, setOuvreModal] = useState({ type: null, data: null }); // Affichage type popup
    const [nouveau_nom, setRenommeDossier] = useState('');
    
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
            console.error('Erreur lors de la récupération des données :', error);
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
                if (!dossier || taille_dossiers[dossier.idDossier] !== undefined) return null;
                try {
                    const res = await axios.get(
                        `http://localhost:3000/api/dossiers/${dossier.idDossier}/fichiers`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const sum = (res.data || []).reduce((acc, f) => acc + (f.taille || 0), 0);
                    return { id: dossier.idDossier, size: sum };
                } catch (err) {
                    alert('Erreur :'+err);
                    return { id: dossier.idDossier, size: 0 };
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
            const [response_dossiers, response_fichiers] = await Promise.all([
                axios.get(`http://localhost:3000/api/dossiers/${dossier.idDossier}/sous-dossiers`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`http://localhost:3000/api/dossiers/${dossier.idDossier}/fichiers`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            
            setDossierActuel(dossier);
            setContenuDossier({
                dossiers: response_dossiers.data || [],
                fichiers: response_fichiers.data || []
            });
            setFilAriane([...fil_ariane, dossier]);
        } catch (error) {
            console.error('Erreur lors de la récupération du contenu du dossier :', error);
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
                const nouveau_breadcrumb = fil_ariane.slice(0, index + 1);
                const dossier_selectionne = nouveau_breadcrumb[index];
                
                // Charger le contenu du dossier sélectionné
                const [response_dossiers, response_fichiers] = await Promise.all([
                    axios.get(`http://localhost:3000/api/dossiers/${dossier_selectionne.idDossier}/sous-dossiers`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`http://localhost:3000/api/dossiers/${dossier_selectionne.idDossier}/fichiers`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                
                setFilAriane(nouveau_breadcrumb);
                setDossierActuel(dossier_selectionne);
                setContenuDossier({
                    dossiers: response_dossiers.data || [],
                    fichiers: response_fichiers.data || []
                });
            }
        } catch (error) {
            console.error('Erreur lors de la navigation :', error);
        }
    };

    const naviguerVersUpload = () => {
        // Passe l'état complet pour garder le dossier actuel dans la page Upload
        navigate('/upload', { 
            state: { 
                folderId: dossier_actuel ? dossier_actuel.idDossier : "",
                dossierActuel: dossier_actuel,
                path: fil_ariane 
            } 
        });
    };

    const handleDragEnterGlobal = (e) => {
        e.preventDefault();
        e.stopPropagation();
        compteur_drag.current += 1;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setEtatSurvoleUpload(true);
        }
    };

    const handleDragLeaveGlobal = (e) => {
        e.preventDefault();
        e.stopPropagation();
        compteur_drag.current -= 1;
        // Si on a quitté tous les éléments enfants et qu'on sort du conteneur
        if (compteur_drag.current === 0) {
            setEtatSurvoleUpload(false);
        }
    };

    const handleDragOverGlobal = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDropGlobal = async (e, id_dossier_specifique = null) => {
        e.preventDefault();
        e.stopPropagation();
        setEtatSurvoleUpload(false);
        setDossierSurvoleUpload(null);
        compteur_drag.current = 0;

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        // cible_id = soit le dossier survolé, soit le dossier actuel ouvert
        const cible_id = id_dossier_specifique || (dossier_actuel ? dossier_actuel.idDossier : null);
        
        if (!cible_id) {
            setEtatSurvoleUpload(false);
            setError("Impossible de publier à la racine.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            files.forEach(file => formData.append('fichiers', file));

            await axios.post(
                `http://localhost:3000/api/dossiers/${cible_id}/televerser-multiple`,
                formData,
                { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
            );

            // Rafraîchir le contenu si on a déposé dans le dossier actuellement ouvert
            if (cible_id === (dossier_actuel?.idDossier)) {
                const resFichiers = await axios.get(
                    `http://localhost:3000/api/dossiers/${cible_id}/fichiers`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setContenuDossier(prev => ({ ...prev, fichiers: resFichiers.data || [] }));
            }
        } catch (err) {
            setError('Erreur lors de l\'upload : ' + (err.response?.data?.error || err.message));
        }
    };

    // Gestion de la création d'un dossier via le modale
    const gestionCreeDossier = async (e) => {
        e.preventDefault();
        
        const nom_dossier = menu_nom_dossier.trim();
        
        if (!nom_dossier) {
            setError('Le nom du dossier ne peut pas être vide');
            return;
        }

        const liste_dossiers_actuels = dossier_actuel ? contenu_dossier.dossiers : dossiers;
        const nom_existe_deja = liste_dossiers_actuels.some(
            d => d.cheminDaccesDossier.toLowerCase() === nom_dossier.toLowerCase()
        );
        if (nom_existe_deja) {
            setError('Un dossier portant ce nom existe déjà à cet emplacement.');
            return;
        }

        setCreating(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            
            const response = await axios.post(
                'http://localhost:3000/api/dossiers',
                {
                    cheminDaccesDossier: nom_dossier,
                    idDossierParent: dossier_actuel ? dossier_actuel.idDossier : null
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
            setOuvreModal({ type: null, data: null });
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors de la création du dossier');
            console.error('Erreur lors de la création de dossier :', err);
        } finally {
            setCreating(false);
        }
    };

    const ouvrirModalRenommer = (dossier) => {
        setRenommeDossier(dossier.cheminDaccesDossier);
        setError('');
        setOuvreModal({ type: 'rename', data: dossier });
        setMenuOptionsDossier(null);
    };

    const confirmerRenommage = async () => {
        const nouveau_nom_dossier = nouveau_nom.trim();
        
        if (!nouveau_nom_dossier) {
            setError('Le nom du dossier ne peut pas être vide');
            return;
        }

        const liste_dossiers_actuels = dossier_actuel ? contenu_dossier.dossiers : dossiers;
        const nom_existe_deja = liste_dossiers_actuels.some(
            d => d.cheminDaccesDossier.toLowerCase() === nouveau_nom_dossier.toLowerCase() 
            && d.idDossier !== ouvre_modal.data.idDossier
        );
        if (nom_existe_deja) {
            setError('Un dossier portant ce nom existe déjà à cet emplacement.');
            return;
        }
        setError('');

        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(
                `http://localhost:3000/api/dossiers/${ouvre_modal.data.idDossier}`,
                { cheminDaccesDossier: nouveau_nom_dossier },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Mise à jour de l'affichage
            if (dossier_actuel) {
                setContenuDossier(prev => ({
                    ...prev,
                    dossiers: prev.dossiers.map(d => d.idDossier === ouvre_modal.data.idDossier ? res.data : d)
                }));
            } else {
                setDossiers(prev => prev.map(d => d.idDossier === ouvre_modal.data.idDossier ? res.data : d));
            }
            setOuvreModal({ type: null, data: null });
        } catch (err) {
            console.error('Erreur lors du renommage de dossier :', err);
            setError(err.response?.data?.error || 'Erreur lors du renommage');
        }
    };

    const ouvrirModalSuppression = async (dossier) => {
        setError('');
        setOuvreModal({ type: 'delete', data: dossier });
        setMenuOptionsDossier(null);

        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `http://localhost:3000/api/dossiers/${dossier.idDossier}/vers-corbeille`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (dossier_actuel) {
                setContenuDossier(prev => ({
                    ...prev,
                    dossiers: prev.dossiers.filter(d => d.idDossier !== dossier.idDossier)
                }));
            } else {
                setDossiers(prev => prev.filter(d => d.idDossier !== dossier.idDossier));
            }
            if (!dossier_actuel) fetchData();

            setMenuOptionsDossier(null);
            setOuvreModal({ type: 'delete_success', data: dossier });
            setTimeout(() => setOuvreModal({ type: null, data: null }), 2000);
            
        } catch (err) {
            console.error('Erreur lors du déplacement vers la corbeille :', err);
            setOuvreModal({ type: null, data: null });
            setError(err.response?.data?.error || 'Erreur lors du déplacement vers la corbeille');
        }
    };

    const ouvrirModalSuppressionDefinitive = (dossier) => {
        setError('');
        setOuvreModal({ type: 'delete_permanent', data: dossier });
        setMenuOptionsDossier(null);
    };

    const confirmerSuppressionDefinitive = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `http://localhost:3000/api/dossiers/${ouvre_modal.data.idDossier}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setContenuDossier(prev => ({
                ...prev,
                dossiers: prev.dossiers.filter(d => d.idDossier !== ouvre_modal.data.idDossier)
            }));
            
            setOuvreModal({ type: null, data: null });
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors de la suppression définitive');
        }
    };

    const ouvrirModalViderCorbeille = () => {
        setError('');
        setOuvreModal({ type: 'empty_trash', data: null });
    };

    const confirmerViderCorbeille = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `http://localhost:3000/api/corbeille/vider`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setContenuDossier({ dossiers: [], fichiers: [] });
            setOuvreModal({ type: null, data: null });
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors du vidage de la corbeille');
        }
    };

    const ouvrirModalRestauration = (dossier) => {
        setError('');
        setOuvreModal({ type: 'restore', data: dossier });
        setMenuOptionsDossier(null);
    };

    const confirmerRestauration = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://localhost:3000/api/dossiers/${ouvre_modal.data.idDossier}/restaurer`,
                {}, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setContenuDossier(prev => ({
                ...prev,
                dossiers: prev.dossiers.filter(d => d.idDossier !== ouvre_modal.data.idDossier)
            }));
            
            setOuvreModal({ type: 'restore_success', data: ouvre_modal.data });
            setTimeout(() => setOuvreModal({ type: null, data: null }), 2000);
            
        } catch (err) {
            console.error('Erreur lors de la restauration :', err);
            setError(err.response?.data?.error || 'Erreur lors de la restauration');
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
    const dossiers_visible = (displayItems.dossiers || []).filter(d => 
        d && d.cheminDaccesDossier && !d.cheminDaccesDossier.startsWith('.')
    );
    const corbeille = (displayItems.dossiers || []).find(d => 
        d && d.cheminDaccesDossier && (d.cheminDaccesDossier === '.corbeille')
    );
    const estDansCorbeille = fil_ariane.some(dossier => dossier.cheminDaccesDossier === '.corbeille');

    return (
        <div 
            className="dashboard-container"
            onDragEnter={handleDragEnterGlobal}
            onDragOver={handleDragOverGlobal}
            onDragLeave={handleDragLeaveGlobal}
            onDrop={(e) => handleDropGlobal(e)}
        >
            {etat_survole_upload && !dossier_survole_upload && (
                <div className="dashboard-drag-overlay">
                </div>
            )}

            <div className="dashboard-header">
                <div>
                    <h1>Mon Espace</h1>
                    {fil_ariane.length > 0 && (
                        <nav className="breadcrumb" aria-label="Fil d'arianne">
                            <button className="breadcrumb-objet" onClick={() => gestionClicBreadcrumb(-1)}>Mon Espace</button>
                            {fil_ariane.map((dossier, index) => (
                                <React.Fragment key={dossier.idDossier}>
                                    <span className="breadcrumb-separateur">›</span>
                                    <button className="breadcrumb-objet" onClick={() => gestionClicBreadcrumb(index)}>
                                        {dossier.cheminDaccesDossier}
                                    </button>
                                </React.Fragment>
                            ))}
                        </nav>
                    )}
                </div>
<               div className={`dashboard-header-actions ${dossier_actuel ? 'in-folder' : ''}`}>
                    {!estDansCorbeille ? (
                        <>
                            <button className="btn-publie-dashboard-header" onClick={naviguerVersUpload}>
                                Publier un fichier
                            </button>
                            <button className="btn-cree-dossier-dashboard-header" onClick={() => { setChangeNomDossier(''); setError(''); setOuvreModal({ type: 'create', data: null }); }}>
                                Créer un dossier
                            </button>
                        </>
                    ) : (
                        <button 
                            className="btn-cree-dossier-dashboard-header" 
                            style={{ backgroundColor: 'var(--error-color)' }} 
                            onClick={ouvrirModalViderCorbeille}
                        >
                            Vider la corbeille
                        </button>
                    )}
                </div>
            </div>

            {error && !ouvre_modal.type && (
                <div className="dashboard-erreur-globale">
                    <span>{error}</span>
                    <button className="btn-fermer-erreur" onClick={() => setError('')} title="Fermer">✕</button>
                </div>
            )}

            {ouvre_modal.type && (
                <div className="modal-overlay" onClick={() => !creating && setOuvreModal({ type: null, data: null })}>
                    <div className="modal-contenu" onClick={e => e.stopPropagation()}>
                        {ouvre_modal.type === 'create' && (
                            <form onSubmit={gestionCreeDossier}>
                                <h3>Nouveau dossier</h3>
                                <input 
                                    type="text" 
                                    placeholder="Nom du dossier" 
                                    value={menu_nom_dossier} 
                                    onChange={(e) => setChangeNomDossier(e.target.value)} 
                                    disabled={creating}
                                    autoFocus
                                />
                                {error && <p className="erreur-modale">{error}</p>}
                                <div className="modal-bouttons">
                                    <button type="button" className="btn-annuler" onClick={() => setOuvreModal({ type: null, data: null })} disabled={creating}>Annuler</button>
                                    <button type="submit" className="btn-confirmer" disabled={creating}>{creating ? 'Création...' : 'Créer'}</button>
                                </div>
                            </form>
                        )}
                        {ouvre_modal.type === 'rename' && (
                            <div>
                                <h3>Renommer le dossier</h3>
                                <input 
                                    type="text" 
                                    value={nouveau_nom} 
                                    onChange={(e) => setRenommeDossier(e.target.value)} 
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            confirmerRenommage();
                                        }
                                    }}
                                />
                                {error && <p className="erreur-modale">{error}</p>}
                                <div className="modal-bouttons">
                                    <button className="btn-annuler" onClick={() => setOuvreModal({ type: null, data: null })}>Annuler</button>
                                    <button className="btn-confirmer" onClick={confirmerRenommage}>Sauvegarder</button>
                                </div>
                            </div>
                        )}
                        {ouvre_modal.type === 'delete_success' && (
                            <div>
                                <h3>Dossier déplacé</h3>
                                <p>Dossier "{ouvre_modal.data?.cheminDaccesDossier}" déplacé vers la corbeille</p>
                                <div className="modal-bouttons">
                                    <button className="btn-confirmer" onClick={() => setOuvreModal({ type: null, data: null })}>OK</button>
                                </div>
                            </div>
                        )}
                        {ouvre_modal.type === 'delete' && (
                            <div>
                                <h3>Déplacement en cours...</h3>
                                <p>Déplacement du dossier "{ouvre_modal.data?.cheminDaccesDossier}" vers la corbeille</p>
                            </div>
                        )}
                        {ouvre_modal.type === 'delete_permanent' && (
                            <div>
                                <h3>Supprimer définitivement ?</h3>
                                <p>Voulez-vous vraiment supprimer le dossier "{ouvre_modal.data?.cheminDaccesDossier}" ? Cette action est irréversible.</p>
                                {error && <p className="erreur-modale suppression">{error}</p>}
                                <div className="modal-bouttons">
                                    <button className="btn-annuler" onClick={() => setOuvreModal({ type: null, data: null })}>Annuler</button>
                                    <button className="btn-confirmer" style={{ backgroundColor: 'var(--error-color)' }} onClick={confirmerSuppressionDefinitive}>Supprimer</button>
                                </div>
                            </div>
                        )}
                        {ouvre_modal.type === 'empty_trash' && (
                            <div>
                                <h3>Vider la corbeille ?</h3>
                                <p>Tous les éléments présents dans la corbeille seront définitivement supprimés.</p>
                                {error && <p className="erreur-modale suppression">{error}</p>}
                                <div className="modal-bouttons">
                                    <button className="btn-annuler" onClick={() => setOuvreModal({ type: null, data: null })}>Annuler</button>
                                    <button className="btn-confirmer" style={{ backgroundColor: 'var(--error-color)' }} onClick={confirmerViderCorbeille}>Vider</button>
                                </div>
                            </div>
                        )}
                        {ouvre_modal.type === 'restore' && (
                            <div>
                                <h3>Restaurer le dossier ?</h3>
                                <p>Voulez-vous restaurer le dossier "{ouvre_modal.data?.cheminDaccesDossier}" à son emplacement d'origine ?</p>
                                {error && <p className="erreur-modale">{error}</p>}
                                <div className="modal-bouttons">
                                    <button className="btn-annuler" onClick={() => setOuvreModal({ type: null, data: null })}>Annuler</button>
                                    <button className="btn-confirmer" style={{ backgroundColor: '#10b981' }} onClick={confirmerRestauration}>Restaurer</button>
                                </div>
                            </div>
                        )}
                        {ouvre_modal.type === 'restore_success' && (
                            <div>
                                <h3>Dossier restauré ♻️</h3>
                                <p>Le dossier "{ouvre_modal.data?.cheminDaccesDossier}" a bien été remis à sa place d'origine.</p>
                                <div className="modal-bouttons">
                                    <button className="btn-confirmer" onClick={() => setOuvreModal({ type: null, data: null })}>OK</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="dossiers-section">
                <h2>{dossier_actuel ? `Contenu de ${dossier_actuel.cheminDaccesDossier}` : 'Mes dossiers'}</h2>
                
                {allItems.length === 0 ? (
                    <div className="dossier-vide">
                        <p>Aucun dossier ou fichier pour le moment</p>
                        <p className="hint">Cliquez sur "Créer un dossier" ou "Publier un fichier"</p>
                    </div>
                ) : (
                    <div className="dossiers-liste">
                        {dossiers_visible.map((dossier) => (
                            <div 
                                key={dossier.idDossier} 
                                className={`dossier-ligne ${dossier_survole_upload === dossier.idDossier ? 'drag-over' : ''}`} 
                                onClick={() => gestionClicDossier(dossier)}
                                // gestion supplémentaires du drag&drop pour éviter un conflit entre le drag global et le drag sur un dossier spécifique
                                onDragEnter={(e) => { 
                                    e.preventDefault(); 
                                    e.stopPropagation(); 
                                    setDossierSurvoleUpload(dossier.idDossier); 
                                }}
                                onDragOver={(e) => { 
                                    e.preventDefault(); 
                                    e.stopPropagation(); 
                                }}
                                onDragLeave={(e) => { 
                                    e.preventDefault(); 
                                    e.stopPropagation();
                                    if (!e.currentTarget.contains(e.relatedTarget)) {
                                        setDossierSurvoleUpload(null);
                                    }
                                }}
                                onDrop={(e) => { 
                                    e.stopPropagation(); 
                                    handleDropGlobal(e, dossier.idDossier); 
                                }}
                            >
                                <div className="col-nom">
                                    <span>📁</span>
                                    <span className="dossier-nom">{dossier.cheminDaccesDossier}</span>
                                </div>
                                <div className="col-id">ID: {dossier.idDossier}</div>
                                <div className="col-taille">{taille_dossiers[dossier.idDossier] !== undefined ? formatFileSize(taille_dossiers[dossier.idDossier]) : '...'}</div>
                                <div className="col-actions">
                                    {menu_options_dossier === dossier.idDossier && (
                                        <div className="actions-rapides" onClick={(e) => e.stopPropagation()}>
                                            {!estDansCorbeille ? (
                                                <>
                                                    <button className="action-icon-btn" onClick={() => ouvrirModalRenommer(dossier)} title="Renommer">✏️</button>
                                                    <button className="action-icon-btn" onClick={() => ouvrirModalSuppression(dossier)} title="Déplacer vers la corbeille">🗑️</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className="action-icon-btn" onClick={() => ouvrirModalRestauration(dossier)} title="Restaurer le dossier">♻️</button>
                                                    <button className="action-icon-btn" onClick={() => ouvrirModalSuppressionDefinitive(dossier)} title="Supprimer définitivement">❌</button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    <button 
                                        className="options-btn" 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setMenuOptionsDossier(menu_options_dossier === dossier.idDossier ? null : dossier.idDossier); 
                                        }}
                                        title="Options"
                                    >
                                        ⋮
                                    </button>
                                </div>
                            </div>
                        ))}
                        
                        {displayItems.fichiers.map((fichier, index) => (
                            <div key={`file-${index}`} className="dossier-ligne fichier-ligne">
                                <div className="col-nom">
                                    <span>📄</span>
                                    <span className="dossier-nom">{fichier.nom}</span>
                                </div>
                                <div className="col-id">{new Date(fichier.dateModification).toLocaleDateString('fr-FR')}</div>
                                <div className="col-taille">{formatFileSize(fichier.taille)}</div>
                                <div className="col-actions">
                                    <button className="options-btn" onClick={(e) => { e.stopPropagation(); alert('Fonctionnalités fichier à implémenter'); }}>⋮</button>
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
                        <div className="icone-corbeille">🗑️</div>
                        <h3>Corbeille</h3>
                        <p className="taille-dossier">{taille_dossiers[corbeille.idDossier] !== undefined ? formatFileSize(taille_dossiers[corbeille.idDossier]) : 'Calcul...'}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
