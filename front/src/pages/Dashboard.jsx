import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import '../styles/Dashboard.css';

function Dashboard() {
    const {
        loading, creating, error, setError,
        etat_survole_upload, dossier_survole_upload, setDossierSurvoleUpload,
        ouvre_modal, setOuvreModal,
        menu_nom_dossier, setChangeNomDossier, nouveau_nom, setRenommeDossier,
        dossier_actuel, contenu_dossier, fil_ariane,
        taille_dossiers, dossiers, fichiers_base,
        menu_options_dossier, setMenuOptionsDossier,
        menu_options_fichier, setMenuOptionsFichier,
        fichier_preview, chargement_preview, corbeille_info,
        naviguerVersUpload,
        handleDragEnterGlobal, handleDragLeaveGlobal, handleDragOverGlobal, handleDropGlobal,
        gestionClicDossier, gestionClicBreadcrumb,
        gestionCreeDossier, 
        ouvrirModalRenommerDossier, confirmerRenommageDossier,
        ouvrirModalSuppressionDossier, ouvrirModalSuppressionDefinitiveDossier, confirmerSuppressionDefinitiveDossier,
        restaurerDossier,
        ouvrirModalViderCorbeille, confirmerViderCorbeille,
        telechargerFichier, restaurerFichier, 
        ouvrirModalSuppressionFichier, ouvrirModalSuppressionDefinitiveFichier, confirmerSuppressionDefinitiveFichier,
        ouvrirApercu, fermerApercu,
        formatFileSize,
    } = useDashboard();

    if (loading) return <div className="dashboard-container">Chargement...</div>;

    const displayItems = dossier_actuel
        ? { dossiers: contenu_dossier.dossiers || [], fichiers: contenu_dossier.fichiers || [] }
        : { dossiers, fichiers: fichiers_base };

    const allItems = [...displayItems.dossiers, ...displayItems.fichiers];
    const estDansCorbeille = fil_ariane.some(d => d.cheminDaccesDossier === '.corbeille');

    return (
        <div
            className="dashboard-container"
            onDragEnter={handleDragEnterGlobal}
            onDragOver={handleDragOverGlobal}
            onDragLeave={handleDragLeaveGlobal}
            onDrop={(e) => handleDropGlobal(e)}
            onClick={() => { setMenuOptionsDossier(null); setMenuOptionsFichier(null); }}
        >
            {etat_survole_upload && !dossier_survole_upload && (
                <div className="dashboard-drag-overlay" />
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
                <div className={`dashboard-header-actions ${dossier_actuel ? 'in-folder' : ''}`}>
                    {!estDansCorbeille ? (
                        <>
                            <button className="btn-publie-dashboard-header" onClick={naviguerVersUpload}>Publier un fichier</button>
                            <button className="btn-cree-dossier-dashboard-header" onClick={() => { setChangeNomDossier(''); setError(''); setOuvreModal({ type: 'creation-dossier', data: null }); }}>
                                Créer un dossier
                            </button>
                        </>
                    ) : (
                        <button className="btn-cree-dossier-dashboard-header" onClick={ouvrirModalViderCorbeille}>Vider la corbeille</button>
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

                        {ouvre_modal.type === 'creation-dossier' && (
                            <form onSubmit={gestionCreeDossier}>
                                <h3>Nouveau dossier</h3>
                                <input type="text" placeholder="Nom du dossier" value={menu_nom_dossier}
                                    onChange={(e) => setChangeNomDossier(e.target.value)} disabled={creating} autoFocus />
                                {error && <p className="erreur-modale">{error}</p>}
                                <div className="modal-bouttons">
                                    <button type="button" className="btn-annuler" onClick={() => setOuvreModal({ type: null, data: null })} disabled={creating}>Annuler</button>
                                    <button type="submit" className="btn-confirmer" disabled={creating}>{creating ? 'Création...' : 'Créer'}</button>
                                </div>
                            </form>
                        )}

                        {ouvre_modal.type === 'renommage-dossier' && (
                            <div>
                                <h3>Renommer le dossier</h3>
                                <input type="text" value={nouveau_nom} onChange={(e) => setRenommeDossier(e.target.value)} autoFocus
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmerRenommageDossier(); } }} />
                                {error && <p className="erreur-modale">{error}</p>}
                                <div className="modal-bouttons">
                                    <button className="btn-annuler" onClick={() => setOuvreModal({ type: null, data: null })}>Annuler</button>
                                    <button className="btn-confirmer" onClick={confirmerRenommageDossier}>Sauvegarder</button>
                                </div>
                            </div>
                        )}

                        {ouvre_modal.type === 'confirmation-suppression-dossier' && (
                            <div>
                                <h3>Supprimer définitivement ?</h3>
                                <p>Voulez-vous vraiment supprimer le dossier "{ouvre_modal.data?.cheminDaccesDossier}" ? Cette action est irréversible.</p>
                                {error && <p className="erreur-modale suppression">{error}</p>}
                                <div className="modal-bouttons">
                                    <button className="btn-annuler" onClick={() => setOuvreModal({ type: null, data: null })}>Annuler</button>
                                    <button className="btn-confirmer" onClick={confirmerSuppressionDefinitiveDossier}>Supprimer</button>
                                </div>
                            </div>
                        )}

                        {ouvre_modal.type === 'suppression-dossier' && (
                            <div>
                                <h3>Déplacement en cours...</h3>
                                <p>Déplacement du dossier "{ouvre_modal.data?.cheminDaccesDossier}" vers la corbeille</p>
                            </div>
                        )}

                        {ouvre_modal.type === 'suppression-reussie-dossier' && (
                            <div>
                                <h3>Dossier déplacé</h3>
                                <p>Dossier "{ouvre_modal.data?.cheminDaccesDossier}" déplacé vers la corbeille</p>
                                <div className="modal-bouttons">
                                    <button className="btn-confirmer" onClick={() => setOuvreModal({ type: null, data: null })}>OK</button>
                                </div>
                            </div>
                        )}
                        
                        {ouvre_modal.type === 'confirmation-suppression-fichier' && (
                            <div>
                                <h3>Supprimer définitivement ?</h3>
                                <p>Voulez-vous vraiment supprimer le fichier "{ouvre_modal.data?.nom}" ? Cette action est irréversible.</p>
                                {error && <p className="erreur-modale suppression">{error}</p>}
                                <div className="modal-bouttons">
                                    <button className="btn-annuler" onClick={() => setOuvreModal({ type: null, data: null })}>Annuler</button>
                                    <button className="btn-confirmer" onClick={confirmerSuppressionDefinitiveFichier}>Supprimer</button>
                                </div>
                            </div>
                        )}

                        {ouvre_modal.type === 'suppression-fichier' && (
                            <div>
                                <h3>Déplacement en cours...</h3>
                                <p>Déplacement du fichier "{ouvre_modal.data?.nom}" vers la corbeille</p>
                            </div>
                        )}

                        {ouvre_modal.type === 'suppression-reussie-fichier' && (
                            <div>
                                <h3>Fichier déplacé</h3>
                                <p>Fichier "{ouvre_modal.data?.nom}" déplacé vers la corbeille</p>
                                <div className="modal-bouttons">
                                    <button className="btn-confirmer" onClick={() => setOuvreModal({ type: null, data: null })}>OK</button>
                                </div>
                            </div>
                        )}

                        {ouvre_modal.type === 'vidage-corbeille' && (
                            <div>
                                <h3>Vider la corbeille ?</h3>
                                <p>Tous les éléments présents dans la corbeille seront définitivement supprimés.</p>
                                {error && <p className="erreur-modale suppression">{error}</p>}
                                <div className="modal-bouttons">
                                    <button className="btn-annuler" onClick={() => setOuvreModal({ type: null, data: null })}>Annuler</button>
                                    <button className="btn-confirmer" onClick={confirmerViderCorbeille}>Vider</button>
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
                        {displayItems.dossiers.map((dossier) => (
                            <div
                                key={dossier.idDossier}
                                className={`dossier-ligne ${dossier_survole_upload === dossier.idDossier ? 'drag-over' : ''}`}
                                onClick={() => gestionClicDossier(dossier)}
                                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDossierSurvoleUpload(dossier.idDossier); }}
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); if (!e.currentTarget.contains(e.relatedTarget)) setDossierSurvoleUpload(null); }}
                                onDrop={(e) => { e.stopPropagation(); handleDropGlobal(e, dossier.idDossier); }}
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
                                                    <button className="action-icon-btn" onClick={() => ouvrirModalRenommerDossier(dossier)} title="Renommer">✏️</button>
                                                    <button className="action-icon-btn" onClick={() => ouvrirModalSuppressionDossier(dossier)} title="Déplacer vers la corbeille">🗑️</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className="action-icon-btn" onClick={() => restaurerDossier(dossier)} title="Restaurer le dossier">♻️</button>
                                                    <button className="action-icon-btn" onClick={() => ouvrirModalSuppressionDefinitiveDossier(dossier)} title="Supprimer définitivement">❌</button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    <button
                                        className="options-btn"
                                        onClick={(e) => { e.stopPropagation(); setMenuOptionsDossier(menu_options_dossier === dossier.idDossier ? null : dossier.idDossier); }}
                                        title="Options"
                                    >⋮</button>
                                </div>
                            </div>
                        ))}

                        {displayItems.fichiers.map((fichier, index) => (
                            <div
                                key={`file-${index}`}
                                className="dossier-ligne fichier-ligne"
                                onClick={() => ouvrirApercu(fichier)}
                                style={{ cursor: chargement_preview ? 'wait' : 'pointer' }}
                            >
                                <div className="col-nom">
                                    <span>📄</span>
                                    <span className="dossier-nom">{fichier.nom}</span>
                                </div>
                                <div className="col-id">{new Date(fichier.dateModification).toLocaleDateString('fr-FR')}</div>
                                <div className="col-taille">{formatFileSize(fichier.taille)}</div>
                                <div className="col-actions">
                                    {menu_options_fichier === fichier.nom && (
                                        <div className="actions-rapides" onClick={(e) => e.stopPropagation()}>
                                            {!estDansCorbeille ? (
                                                <>
                                                    <button className="action-icon-btn" onClick={() => telechargerFichier(fichier)} title="Télécharger">⬇️</button>
                                                    <button className="action-icon-btn" onClick={() => ouvrirModalSuppressionFichier(fichier)} title="Déplacer vers la corbeille">🗑️</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className="action-icon-btn" onClick={() => restaurerFichier(fichier)} title="Restaurer le fichier">♻️</button>
                                                    <button className="action-icon-btn" onClick={() => ouvrirModalSuppressionDefinitiveFichier(fichier)} title="Supprimer définitivement">❌</button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    <button
                                        className="options-btn"
                                        onClick={(e) => { e.stopPropagation(); setMenuOptionsFichier(menu_options_fichier === fichier.nom ? null : fichier.nom); }}
                                        title="Options"
                                    >⋮</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {corbeille_info && !dossier_actuel && (
                <div className="section-corbeille">
                    <h2>Corbeille</h2>
                    <div
                        className="bloc-corbeille"
                        role="button"
                        tabIndex={0}
                        onClick={() => gestionClicDossier(corbeille_info)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') gestionClicDossier(corbeille_info); }}
                        aria-label="Ouvrir la corbeille"
                    >
                        <div className="icone-corbeille">🗑️</div>
                        <h3>Corbeille</h3>
                        <p className="taille-dossier">{taille_dossiers[corbeille_info.idDossier] !== undefined ? formatFileSize(taille_dossiers[corbeille_info.idDossier]) : 'Calcul...'}</p>
                    </div>
                </div>
            )}

            {fichier_preview && (
                <div className="modal-overlay" onClick={fermerApercu}>
                    <div className="modal-preview-contenu" onClick={e => e.stopPropagation()}>
                        <div className="preview-header">
                            <h3>{fichier_preview.nom}</h3>
                            <button className="btn-fermer-preview" onClick={fermerApercu}>✕</button>
                        </div>
                        <div className="preview-body">
                            {fichier_preview.type === 'image' && <img src={fichier_preview.url} alt={fichier_preview.nom} />}
                            {fichier_preview.type === 'video' && <video controls autoPlay src={fichier_preview.url} />}
                            {fichier_preview.type === 'audio' && <audio controls autoPlay src={fichier_preview.url} />}
                            {fichier_preview.type === 'document' && <iframe src={fichier_preview.url} title={fichier_preview.nom} />}
                            {fichier_preview.type === 'non_supporte' && <div>L'affichage de ce type de fichier n'est pas supporté.</div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;