import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Upload.css';

function Upload() {
    const [glisser_actif, setGlisserActif] = useState(false);
    const [fichiers, setFichiers] = useState([]);
    const [en_cours_de_televersement, setEnCoursDeTeleversement] = useState(false);
    
    const url_localisation = useLocation();
    const naviguer = useNavigate();

    const [dossier_actuel, setDossierActuel] = useState(url_localisation.state?.dossierActuel || null);
    const [chemin_acces, setCheminAcces] = useState(url_localisation.state?.path || []);
    const [sous_dossiers_affiches, setSousDossiersAffiches] = useState([]);

    useEffect(() => {
        // Charge les sous-dossiers du dossier actuellement sélectionné
        const recuperer_dossiers = async () => {
            try {
                const token = localStorage.getItem('token');
                const utilisateur = JSON.parse(localStorage.getItem('user'));
                
                let url_api = dossier_actuel 
                    ? `http://localhost:3000/api/dossiers/${dossier_actuel.iddossier}/sous-dossiers`
                    : `http://localhost:3000/api/comptes/${utilisateur.id}/dossiers`;

                const reponse = await axios.get(url_api, { headers: { Authorization: `Bearer ${token}` } });
                setSousDossiersAffiches(reponse.data || []);
            } catch (error) {
                console.error('Erreur :', error);
            }
        };
        recuperer_dossiers();
    }, [dossier_actuel]);

    const naviguer_dans_dossier = (dossier_cible, index = null) => {
        setDossierActuel(dossier_cible);
        if (dossier_cible === null) {
            setCheminAcces([]);
        } else if (index !== null) {
            // Retour en arrière dans le fil d'Ariane
            setCheminAcces(chemin_acces.slice(0, index + 1));
        } else {
            // Avancer dans un sous-dossier
            setCheminAcces([...chemin_acces, dossier_cible]);
        }
    };

    const gestion_survol_glisser = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.type === "dragenter" || event.type === "dragover") {
            setGlisserActif(true);
        } else if (event.type === "dragleave") {
            setGlisserActif(false);
        }
    };

    const gestion_depot = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setGlisserActif(false);
        
        if (event.dataTransfer.fichiers && event.dataTransfer.fichiers[0]) {
            setFichiers(Array.from(event.dataTransfer.fichiers));
        }
    };

    const gestion_changement_fichier = (event) => {
        if (event.target.files && event.target.files[0]) {
            setFichiers(Array.from(event.target.files));
        }
    };

    const gestion_televersement = async (event) => {
        event.preventDefault();
        
        if (fichiers.length === 0) {
            alert('Veuillez sélectionner au moins un fichier');
            return;
        }
        
        if (!dossier_actuel || !dossier_actuel.iddossier) {
            alert('Veuillez d\'abord sélectionner un dossier de destination.');
            return;
        }

        setEnCoursDeTeleversement(true);
        try {
            const token = localStorage.getItem('token');
            const donnees_formulaire = new FormData();
            
            fichiers.forEach(fichier => {
                donnees_formulaire.append('fichiers', fichier);
            });

            await axios.post(
                `http://localhost:3000/api/dossiers/${dossier_actuel.iddossier}/televerser-multiple`,
                donnees_formulaire,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setFichiers([]);
            naviguer('/dashboard');
        } catch (error) {
            alert('erreur lors du téléversement : ' + (error.response?.data?.error || error.message));
        } finally {
            setEnCoursDeTeleversement(false);
        }
    };

    const supprimer_fichier = (index) => {
        setFichiers(fichiers.filter((_, i) => i !== index));
    };

    return (
        <div className="conteneur-upload">
            <div className="carte-upload">
                <h2>Uploader des fichiers</h2>
                
                <form onSubmit={gestion_televersement}>
                    <div className="groupe-formulaire">
                        <label>Dossier de destination</label>
                        <div className="upload-navigateur">
                            <div className="upload-fil-ariane">
                                <span className="upload-lien-ariane" onClick={() => naviguer_dans_dossier(null)}>Racine</span>
                                {chemin_acces.map((dossier, index) => (
                                    <React.Fragment key={dossier.iddossier}>
                                        <span className="separateur">/</span>
                                        <span className="upload-lien-ariane" onClick={() => naviguer_dans_dossier(dossier, index)}>
                                            {dossier.chemindaccesdossier}
                                        </span>
                                    </React.Fragment>
                                ))}
                            </div>
                            
                            {sous_dossiers_affiches.length > 0 && (
                                <select 
                                    className="upload-select"
                                    onChange={(event) => {
                                        const dossier_trouve = sous_dossiers_affiches.find(d => d.iddossier == event.target.value);
                                        if(dossier_trouve) naviguer_dans_dossier(dossier_trouve);
                                        event.target.value = ""; // Réinitialise le select après le clic sinon il reste sur le dernier dossier sélectionné et déclenche pas l'événement si on clique à nouveau dessus
                                    }}
                                >
                                    <option value="">+ Aller dans un sous-dossier...</option>
                                    {sous_dossiers_affiches.map(d => (
                                        <option key={d.iddossier} value={d.iddossier}>{d.chemindaccesdossier}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    <div 
                        className={`zone-glisser-deposer ${glisser_actif ? 'active' : ''}`}
                        onDragEnter={gestion_survol_glisser}
                        onDragLeave={gestion_survol_glisser}
                        onDragOver={gestion_survol_glisser}
                        onDrop={gestion_depot}
                    >
                        <div className="contenu-glisser-deposer">
                            <span className="icone-upload">📁</span>
                            <p>Glissez vos fichiers ici ou</p>
                            <label htmlFor="entree-fichier" className="etiquette-fichier">
                                cliquez pour parcourir
                            </label>
                            <input
                                id="entree-fichier"
                                type="file"
                                multiple
                                onChange={gestion_changement_fichier}
                                style={{ display: 'none' }}
                            />
                        </div>
                    </div>

                    {fichiers.length > 0 && (
                        <div className="liste-fichiers">
                            <h3>Fichiers à uploader ({fichiers.length})</h3>
                            {fichiers.map((fichier, index) => (
                                <div key={index} className="element-fichier">
                                    <span className="nom-fichier">{fichier.name}</span>
                                    <span className="taille-fichier">
                                        {(fichier.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => supprimer_fichier(index)}
                                        className="bouton-supprimer"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="bouton-televerser"
                        disabled={fichiers.length === 0 || en_cours_de_televersement}
                    >
                        {en_cours_de_televersement ? 'Upload en cours...' : 'Uploader'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Upload;