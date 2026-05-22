import React from 'react';
import { FolderUp } from 'lucide-react';
import { useUpload } from '../hooks/useUpload';
import '../styles/Upload.css';

function Upload() {
    const {
        glisser_actif,
        fichiers,
        en_cours_de_televersement,
        barre_de_progression,
        upload_reussi,
        chemin_acces,
        sous_dossiers_affiches,
        erreur_upload,
        gestionGlisserEntrer,
        gestionGlisserQuitter,
        gestionDepot,
        gestionChangementFichier,
        supprimerFichierSelectionne,
        gestionSoumission,
        naviguerDossier
    } = useUpload();

    return (
        <div className="conteneur-upload">
            <div className="carte-upload">
                <h2>Uploader des fichiers</h2>
                
                {upload_reussi && (
                    <div className="upload-banniere-succes">
                        <span>Vos fichiers ont été téléversés avec succès !</span>
                    </div>
                )}
                
                <form onSubmit={gestionSoumission}>
                    <div className="groupe-formulaire">
                        <div>Dossier de destination</div>
                        <div className="upload-navigateur">
                            <div className="upload-fil-ariane">
                                <span className="upload-lien-ariane" onClick={() => naviguerDossier(null)}>Base</span>
                                {chemin_acces.map((dossier, index) => (
                                    <React.Fragment key={dossier.idDossier || `breadcrumb-${index}`}>
                                        <span className="separateur">/</span>
                                        <span className="upload-lien-ariane" onClick={() => naviguerDossier(dossier)}>
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
                                        if(dossier_trouve) naviguerDossier(dossier_trouve);
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
                        onDragEnter={gestionGlisserEntrer}
                        onDragOver={gestionGlisserEntrer}
                        onDragLeave={gestionGlisserQuitter}
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
                                        {fichier.size ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(fichier.size / (1024 * 1024)) + ' Mo' : '0 o'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => supprimerFichierSelectionne(index)}
                                        disabled={en_cours_de_televersement}
                                        className="bouton-supprimer"
                                    >
                                        ✕
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