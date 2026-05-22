import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { FolderUp, X } from 'lucide-react';
import '../styles/Upload.css';

function Upload() {
    const [glisser_actif, setGlisserActif] = useState(false);
    const [fichiers, setFichiers] = useState([]);
    const [en_cours_de_televersement, setEnCoursDeTeleversement] = useState(false);
    const [barre_de_progression, setBarreProgression] = useState(0); 
    
    const url_localisation = useLocation();

    const [dossier_actuel, setDossierActuel] = useState(url_localisation.state?.dossierActuel || null);
    const [dossier_racine, setDossierRacine] = useState(null);
    const [chemin_acces, setCheminAcces] = useState(url_localisation.state?.path || []);
    const [sous_dossiers_affiches, setSousDossiersAffiches] = useState([]);
    const [erreur_upload, setErreurUpload] = useState('');

    useEffect(() => {
        const recupererDossiers = async () => {
            try {
                const token = localStorage.getItem('token');
                const utilisateur = JSON.parse(localStorage.getItem('user'));
                
                if (dossier_actuel) {
                    const url_api = `http://localhost:3000/api/dossiers/${dossier_actuel.idDossier}/sous-dossiers`;
                    const reponse = await axios.get(url_api, { headers: { Authorization: `Bearer ${token}` } });
                    setSousDossiersAffiches(reponse.data || []);
                } else {
                    const url_api_racine = `http://localhost:3000/api/comptes/${utilisateur.id}/dossiers`;
                    const reponse_racine = await axios.get(url_api_racine, { headers: { Authorization: `Bearer ${token}` } });
                    
                    const d_racine = (reponse_racine.data || []).find(d => d.cheminDaccesDossier === `user_${utilisateur.id}`);
                    
                    if (d_racine) {
                        setDossierRacine(d_racine);
                        const url_api_sous = `http://localhost:3000/api/dossiers/${d_racine.idDossier}/sous-dossiers`;
                        const reponse_sous = await axios.get(url_api_sous, { headers: { Authorization: `Bearer ${token}` } });
                        setSousDossiersAffiches(reponse_sous.data || []);
                    }
                }
            } catch (error) {
                console.error('Erreur :', error);
            }
        };
        recupererDossiers();
    }, [dossier_actuel]);

    const naviguerDansDossier = (dossier_cible, index = null) => {
        setDossierActuel(dossier_cible);
        if (dossier_cible === null) {
            setCheminAcces([]);
        } else if (index !== null) {
            setCheminAcces(chemin_acces.slice(0, index + 1));
        } else {
            setCheminAcces([...chemin_acces, dossier_cible]);
        }
    };

    const gestionSurvolGlisser = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.type === "dragenter" || event.type === "dragover") {
            setGlisserActif(true);
        } else if (event.type === "dragleave") {
            setGlisserActif(false);
        }
    };

    const gestionDepot = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setGlisserActif(false);
        
        if (event.dataTransfer.files && event.dataTransfer.files[0]) {
            setFichiers(Array.from(event.dataTransfer.files));
        }
    };

    const gestionChangementFichier = (event) => {
        if (event.target.files && event.target.files[0]) {
            setFichiers(Array.from(event.target.files));
            event.target.value = '';
        }
    };

    const TAILLE_MAX_FICHIER = 10 * 1024 * 1024 * 1024;
    const MAX_FICHIERS = 10;

    const gestionTeleversement = async (event) => {
        event.preventDefault();
        setErreurUpload('');
        
        if (fichiers.length === 0) {
            setErreurUpload('Veuillez sélectionner au moins un fichier');
            return;
        }

        if (fichiers.length > MAX_FICHIERS) {
            setErreurUpload(`Trop de fichiers. Vous ne pouvez pas envoyer plus de ${MAX_FICHIERS} fichiers à la fois.`);
            return;
        }

        const fichierTropGros = fichiers.find(f => f.size > TAILLE_MAX_FICHIER);
        if (fichierTropGros) {
            setErreurUpload(`Le fichier "${fichierTropGros.name}" dépasse la taille maximale autorisée de "${TAILLE_MAX_FICHIER/1024/1024/1024}" Go.`);
            return;
        }
        
        const cible_id = dossier_actuel ? dossier_actuel.idDossier : dossier_racine?.idDossier;

        if (!cible_id) {
            setErreurUpload('Impossible d\'identifier le dossier de destination (Base introuvable).');
            return;
        }

        setEnCoursDeTeleversement(true);
        setBarreProgression(0);
        try {
            const token = localStorage.getItem('token');
            const donnees_formulaire = new FormData();
            
            fichiers.forEach(fichier => {
                donnees_formulaire.append('fichiers', fichier);
            });

            await axios.post(
                `http://localhost:3000/api/dossiers/${cible_id}/televerser-multiple`,
                donnees_formulaire,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        const pourcentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setBarreProgression(pourcentage);
                    }
                }
            );

            setFichiers([]);
        } catch (error) {
            setErreurUpload(error.response?.data?.error || error.response?.data?.message || 'Erreur lors du téléversement');
        } finally {
            setEnCoursDeTeleversement(false);
            setTimeout(() => setBarreProgression(0), 1000);
        }
    };

    const supprimerFichier = (index) => {
        setFichiers(fichiers.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 o';
        const k = 1024;
        const tailles = ['o', 'Ko', 'Mo', 'Go'];

        const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), tailles.length - 1);
        const tailleCalculee = bytes / Math.pow(k, i);

        const formateur = new Intl.NumberFormat('fr-FR', {
            maximumFractionDigits: 2
        });

        return `${formateur.format(tailleCalculee)} ${tailles[i]}`;
    };

    return (
        <div className="conteneur-upload">
            <div className="carte-upload">
                <h2>Uploader des fichiers</h2>
                
                <form onSubmit={gestionTeleversement}>
                    <div className="groupe-formulaire">
                        <div>Dossier de destination</div>
                        <div className="upload-navigateur">
                            <div className="upload-fil-ariane">
                                <span className="upload-lien-ariane" onClick={() => naviguerDansDossier(null)}>Base</span>
                                {chemin_acces.map((dossier, index) => (
                                    <React.Fragment key={dossier.idDossier || `breadcrumb-${index}`}>
                                        <span className="separateur">/</span>
                                        <span className="upload-lien-ariane" onClick={() => naviguerDansDossier(dossier, index)}>
                                            {dossier.cheminDaccesDossier}
                                        </span>
                                    </React.Fragment>
                                ))}
                            </div>
                            
                            {sous_dossiers_affiches.length > 0 && (
                                <select 
                                    id="dossier-select"
                                    name="dossier_select"
                                    className="upload-select"
                                    onChange={(event) => {
                                        const dossier_trouve = sous_dossiers_affiches.find(d => d.idDossier == event.target.value);
                                        if(dossier_trouve) naviguerDansDossier(dossier_trouve);
                                        event.target.value = "";
                                    }}
                                >
                                    <option value="">+ Aller dans un sous-dossier...</option>
                                    {sous_dossiers_affiches.map((d, index) => (
                                        <option 
                                            key={d.idDossier || `select-${index}`} 
                                            value={d.idDossier}
                                        >
                                            {d.cheminDaccesDossier || 'Dossier sans nom'}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    <div 
                        className={`zone-glisser-deposer ${glisser_actif ? 'active' : ''}`}
                        onDragEnter={gestionSurvolGlisser}
                        onDragLeave={gestionSurvolGlisser}
                        onDragOver={gestionSurvolGlisser}
                        onDrop={gestionDepot}
                    >
                        <div className="contenu-glisser-deposer">
                            <span className="icone-upload" style={{ display: 'inline-block', marginBottom: '10px' }}>
                                <FolderUp size={42} style={{ color: 'var(--btn-primary-color)' }} />
                            </span>
                            <p>Glissez vos fichiers ici ou</p>
                            <label htmlFor="entree-fichier" className="etiquette-fichier">
                                cliquez pour parcourir
                            </label>
                            <input
                                id="entree-fichier"
                                type="file"
                                multiple
                                onChange={gestionChangementFichier}
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
                                        {formatFileSize(fichier.size)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => supprimerFichier(index)}
                                        className="bouton-supprimer"
                                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {en_cours_de_televersement && (
                        <div className="conteneur-progression">
                            <div 
                                className="barre-progression" 
                                style={{ width: `${barre_de_progression}%` }}
                            >
                                {barre_de_progression > 5 ? `${barre_de_progression}%` : ''}
                            </div>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="bouton-televerser"
                        disabled={fichiers.length === 0 || en_cours_de_televersement}
                    >
                        {en_cours_de_televersement ? 'Upload en cours...' : 'Uploader'}
                    </button>
                    {erreur_upload && (
                        <div className="upload-message-erreur">
                            {erreur_upload}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default Upload;