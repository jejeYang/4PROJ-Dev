import React, { useState, useEffect } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import '../styles/Dashboard.css';

function Dashboard() {
    const {
        loading, creating, error, setError,
        etat_survole_upload, dossier_survole_upload, setDossierSurvoleUpload,
        ouvre_modal, setOuvreModal,
        menu_nom_dossier, setChangeNomDossier, nouveau_nom, setRenommeDossier,
        dossier_actuel, contenu_dossier, fil_ariane,
        taille_dossiers, dossiers, fichiers_base, dossier_racine,
        menu_options_dossier, setMenuOptionsDossier,
        menu_options_fichier, setMenuOptionsFichier,
        fichier_preview, chargement_preview, corbeille_info,
        dossier_cible_deplacement, chemin_deplacement, sous_dossiers_deplacement,
        message_partage, formulaire_partage_ouvert,
        mode_formulaire_partage, setModeFormulairePartage, donnees_formulaire_partage, setDonneesFormulairePartage, chargement_partage,
        gestionChangementEmailPartage, gestionBlurEmailPartage, partagerRessource,
        soumettreFormulairePartage, fermerFormulairePartage,
        naviguerVersUpload, handleDragEnterGlobal, handleDragLeaveGlobal, handleDragOverGlobal, handleDropGlobal,
        gestionClicDossier, gestionClicBreadcrumb,
        selection, estSelectionne, toggleSelection, toggleSelectionTout,
        ouvrirModalSuppressionMultiple, supprimerSelection, telechargerSelection, action_en_cours,
        ouvrirModalRestaurerMultiple, restaurerSelection,
        ouvrirModalSuppressionDefinitiveMultiple, supprimerDefinitivementSelection,
        gestionCreeDossier, 
        ouvrirModalRenommerDossier, confirmerRenommageDossier,
        ouvrirModalSuppressionDossier, ouvrirModalSuppressionDefinitiveDossier, confirmerSuppressionDefinitiveDossier,
        restaurerDossier,
        ouvrirModalViderCorbeille, confirmerViderCorbeille,
        telechargerFichier, restaurerFichier, 
        ouvrirModalSuppressionFichier, ouvrirModalSuppressionDefinitiveFichier, confirmerSuppressionDefinitiveFichier,
        tri_config, demanderTri, trierElements,
        ouvrirApercu, fermerApercu,
        ouvrirModalDeplacement, naviguerDeplacement, confirmerDeplacement,
        lancerRecherche, reinitialiserRecherche,
        recherche_active, resultats_recherche, chargement_recherche,
        formatFileSize, tronquerNom, separerNomExtension, obtenirEmojiFichier,
    } = useDashboard();

    const [modal_recherche_ouverte, setModalRechercheOuverte] = useState(false);
    const [recherche_query, setRechercheQuery] = useState('');
    const [recherche_type, setRechercheType] = useState('tout');

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (ouvre_modal.type && !creating) {
                    setOuvreModal({ type: null, data: null });
                }
                if (modal_recherche_ouverte) {
                    setModalRechercheOuverte(false);
                }
                if (fichier_preview) {
                    fermerApercu();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [ouvre_modal.type, creating, modal_recherche_ouverte, fichier_preview, setOuvreModal, fermerApercu]);

    if (loading) return <div className="dashboard-container">Chargement...</div>;

    const id_dossier_courant = dossier_actuel ? dossier_actuel.idDossier : dossier_racine?.idDossier;

    const displayItems = recherche_active
        ? {
            dossiers: (resultats_recherche.dossiers || []).filter(d => d.idDossierParent === id_dossier_courant),
            fichiers: (resultats_recherche.fichiers || []).filter(f => f.idDossier === id_dossier_courant)}
        : dossier_actuel
            ? { dossiers: contenu_dossier.dossiers || [], fichiers: contenu_dossier.fichiers || [] }
            : { dossiers, fichiers: fichiers_base };

    const dossiersTries = trierElements(displayItems.dossiers, 'dossier');
    const fichiersTries = trierElements(displayItems.fichiers, 'fichier');

    const allItems = [...dossiersTries, ...fichiersTries];
    const estDansCorbeille = fil_ariane.some(d => d.cheminDaccesDossier === '.corbeille');
    const toutEstSelectionne = allItems.length > 0 && selection.length === allItems.length;

    const soumettreRecherche = async (e) => {
        e.preventDefault();
        await lancerRecherche(recherche_query, recherche_type);
        setModalRechercheOuverte(false);
    };

    const reinitialiser = () => {
        reinitialiserRecherche();
        setRechercheQuery('');
        setRechercheType('tout');
        setModalRechercheOuverte(false);
    };

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

            {error && !ouvre_modal.type && !formulaire_partage_ouvert && (
                <div className="dashboard-erreur-globale">
                    <span>{error}</span>
                    <button className="btn-fermer-erreur" onClick={() => setError('')} title="Fermer">✕</button>
                </div>
            )}

            {action_en_cours.active && (
                <div className="modal-overlay">
                    <div className="modal-contenu modal-progression">
                        <h3>{action_en_cours.type}</h3>
                        <div className="box-barre-progression">
                            <div 
                                className="barre-progression" 
                                style={{ width: `${action_en_cours.progression}%` }} 
                            />
                        </div>
                        <p className="pourcentage-progression">
                            {action_en_cours.progression}%
                        </p>
                    </div>
                </div>
            )}

            {ouvre_modal.type && !action_en_cours.active && (
                <div className="modal-overlay" onMouseDown={(e) => { 
                    if (e.target === e.currentTarget && !creating) {
                        setOuvreModal({ type: null, data: null });
                    }
                }}>
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

                        {ouvre_modal.type === 'deplacement' && (
                            <div>
                                <h3>Déplacer {ouvre_modal.data.length} élément(s)</h3>
                                <p>Destination actuelle : {dossier_cible_deplacement ? dossier_cible_deplacement.cheminDaccesDossier : 'Mon Espace'}</p>
                                
                                <div className="modal-navigateur-deplacement">
                                    <div className="modal-fil-ariane">
                                        <span className="modal-lien-ariane" onClick={() => naviguerDeplacement(null)}>Mon Espace</span>
                                        {chemin_deplacement.map((dossier, index) => (
                                            <React.Fragment key={dossier.idDossier}>
                                                <span className="separateur">›</span>
                                                <span className="modal-lien-ariane" onClick={() => naviguerDeplacement(dossier, index)}>
                                                    {dossier.cheminDaccesDossier}
                                                </span>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                    
                                    {sous_dossiers_deplacement.length > 0 && (
                                        <select 
                                            className="modal-select-deplacement"
                                            onChange={(e) => {
                                                const dossier_trouve = sous_dossiers_deplacement.find(d => d.idDossier == e.target.value);
                                                if(dossier_trouve) naviguerDeplacement(dossier_trouve);
                                                e.target.value = "";
                                            }}
                                        >
                                            <option value="">+ Entrer dans un sous-dossier...</option>
                                            {sous_dossiers_deplacement.map((d) => (
                                                <option key={d.idDossier} value={d.idDossier}>
                                                    {d.cheminDaccesDossier}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {error && <p className="erreur-modale suppression">{error}</p>}
                                
                                <div className="modal-bouttons">
                                    <button className="btn-annuler" onClick={() => setOuvreModal({ type: null, data: null })}>Annuler</button>
                                    <button className="btn-confirmer" onClick={confirmerDeplacement}>Déplacer ici</button>
                                </div>
                            </div>
                        )}

                        {ouvre_modal.type === 'confirmation-suppression-multiple' && (
                            <div>
                                <h3>Déplacer vers la corbeille ?</h3>
                                <p>Voulez-vous vraiment déplacer les <strong>{ouvre_modal.data}</strong> éléments sélectionnés vers la corbeille ?</p>
                                {error && <p className="erreur-modale suppression">{error}</p>}
                                <div className="modal-bouttons">
                                    <button className="btn-annuler" onClick={() => setOuvreModal({ type: null, data: null })}>Annuler</button>
                                    <button className="btn-confirmer" onClick={supprimerSelection}>Déplacer</button>
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

                        {ouvre_modal.type === 'confirmation-restauration-multiple' && (
                            <div>
                                <h3>Restaurer la sélection ?</h3>
                                <p>Voulez-vous vraiment restaurer les <strong>{ouvre_modal.data}</strong> éléments sélectionnés vers leurs emplacements d'origine ?</p>
                                {error && <p className="erreur-modale suppression">{error}</p>}
                                <div className="modal-bouttons">
                                    <button className="btn-annuler" onClick={() => setOuvreModal({ type: null, data: null })}>Annuler</button>
                                    <button className="btn-confirmer" onClick={restaurerSelection}>Restaurer</button>
                                </div>
                            </div>
                        )}

                        {ouvre_modal.type === 'confirmation-suppression-definitive-multiple' && (
                            <div>
                                <h3>Supprimer définitivement ?</h3>
                                <p>Voulez-vous vraiment supprimer définitivement les <strong>{ouvre_modal.data}</strong> éléments sélectionnés ? Cette action est irréversible.</p>
                                {error && <p className="erreur-modale suppression">{error}</p>}
                                <div className="modal-bouttons">
                                    <button className="btn-annuler" onClick={() => setOuvreModal({ type: null, data: null })}>Annuler</button>
                                    <button className="btn-confirmer" onClick={supprimerDefinitivementSelection}>Supprimer</button>
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
                        
                        {ouvre_modal.type === 'suppression-dossier' && (
                            <div><h3>Déplacement en cours...</h3><p>Déplacement du dossier "{ouvre_modal.data?.cheminDaccesDossier}" vers la corbeille</p></div>
                        )}
                        {ouvre_modal.type === 'suppression-reussie-dossier' && (
                            <div><h3>Dossier déplacé</h3><p>Dossier "{ouvre_modal.data?.cheminDaccesDossier}" déplacé vers la corbeille</p><div className="modal-bouttons"><button className="btn-confirmer" onClick={() => setOuvreModal({ type: null, data: null })}>OK</button></div></div>
                        )}
                        {ouvre_modal.type === 'suppression-fichier' && (
                            <div><h3>Déplacement en cours...</h3><p>Déplacement du fichier "{ouvre_modal.data?.nom}" vers la corbeille</p></div>
                        )}
                        {ouvre_modal.type === 'suppression-reussie-fichier' && (
                            <div><h3>Fichier déplacé</h3><p>Fichier "{ouvre_modal.data?.nom}" déplacé vers la corbeille</p><div className="modal-bouttons"><button className="btn-confirmer" onClick={() => setOuvreModal({ type: null, data: null })}>OK</button></div></div>
                        )}
                    </div>
                </div>
            )}


            {formulaire_partage_ouvert && (
                <div className="modal-overlay" onMouseDown={(e) => { 
                    if (e.target === e.currentTarget) fermerFormulairePartage(); 
                }}>
                    <div className="modal-contenu" onClick={e => e.stopPropagation()}>
                        
                        <div className='partage-header'>
                            <button 
                                type="button"
                                className={mode_formulaire_partage === 'utilisateur' ? 'btn-confirmer' : 'btn-annuler'} 
                                onClick={() => {
                                    setModeFormulairePartage('utilisateur');
                                    setError('');
                                }}
                            >
                                Utilisateur
                            </button>
                            <button 
                                type="button"
                                className={mode_formulaire_partage === 'lien' ? 'btn-confirmer' : 'btn-annuler'} 
                                onClick={() => {
                                    setModeFormulairePartage('lien');
                                    setError('');
                                }}
                            >
                                Invité
                            </button>
                        </div>

                        <h3>
                            {mode_formulaire_partage === 'utilisateur' 
                                ? 'Collaborer avec un utilisateur' 
                                : 'Partager à un invité'}
                        </h3>

                        <form onSubmit={soumettreFormulairePartage}>
                            {mode_formulaire_partage === 'utilisateur' ? (
                                <>
                                    <div className="partage-form">
                                        <label htmlFor="share-email" className='partage-label'>Email</label>
                                        <input
                                            id="share-email"
                                            type="email"
                                            placeholder="adresse@email.com"
                                            value={donnees_formulaire_partage.email}
                                            onChange={(e) => gestionChangementEmailPartage(e.target.value)}
                                            onBlur={gestionBlurEmailPartage}
                                            required
                                        />
                                    </div>
                                    <div className="partage-form">
                                        <label htmlFor="share-expiry" className='partage-label'>Date d'expiration (facultatif)</label>
                                        <input
                                            id="share-expiry"
                                            type="datetime-local"
                                            value={donnees_formulaire_partage.dateExpiration}
                                            onChange={(e) => setDonneesFormulairePartage({ ...donnees_formulaire_partage, dateExpiration: e.target.value })}
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="partage-form">
                                        <label htmlFor="share-password" className='partage-label'>Mot de passe</label>
                                        <input
                                            id="share-password"
                                            type="password"
                                            placeholder="Définir un mot de passe"
                                            value={donnees_formulaire_partage.motDePasse}
                                            onChange={(e) => setDonneesFormulairePartage({ ...donnees_formulaire_partage, motDePasse: e.target.value })}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <div className="partage-form">
                                        <label htmlFor="share-expiry" className='partage-label'>Date d'expiration</label>
                                        <input
                                            id="share-expiry"
                                            type="datetime-local"
                                            value={donnees_formulaire_partage.dateExpiration}
                                            onChange={(e) => setDonneesFormulairePartage({ ...donnees_formulaire_partage, dateExpiration: e.target.value })}
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            {error && <p className="erreur-modale">{error}</p>}

                            <div className="modal-bouttons">
                                <button type="button" className="btn-annuler" onClick={fermerFormulairePartage} disabled={chargement_partage}>
                                    Annuler
                                </button>
                                <button type="submit" className="btn-confirmer" disabled={chargement_partage}>
                                    {chargement_partage 
                                        ? 'En cours...' 
                                        : (mode_formulaire_partage === 'lien' ? 'Générer' : 'Confirmer')
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="dossiers-section">
                <div className="dossiers-section-header">
                    <h2>
                        {recherche_active
                            ? 'Résultats de la recherche'
                            : dossier_actuel
                                ? `Contenu de ${dossier_actuel.cheminDaccesDossier}`
                                : 'Mes dossiers'}
                    </h2>

                    {!(allItems.length === 0 && !recherche_active) && (
                        <button
                            className="btn-recherche"
                            style={
                                recherche_active
                                    ? { backgroundColor: 'var(--select-primary-color)', borderColor: 'var(--btn-primary-color)' }
                                    : {}
                            }
                            onClick={() => setModalRechercheOuverte(true)}
                        >
                            Rechercher
                        </button>
                    )}
                </div>

                {message_partage && (
                    <p className="partage-message" >
                        {message_partage}
                    </p>
                )}

                {modal_recherche_ouverte && (
                    <div className="modal-overlay" onMouseDown={(e) => { 
                        if (e.target === e.currentTarget) setModalRechercheOuverte(false); 
                    }}>
                        <div className="modal-contenu modal-recherche" onClick={e => e.stopPropagation()}>
                            <h3>Rechercher</h3>
                            <form onSubmit={soumettreRecherche}>
                                <div className="recherche-champ">
                                    <label>Nom du fichier</label>
                                    <input
                                        type="text"
                                        placeholder="Rechercher par nom ou extension..."
                                        value={recherche_query}
                                        onChange={e => setRechercheQuery(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="recherche-champ">
                                    <label>Type de fichier</label>
                                    <div className="recherche-types">
                                        {['tout', 'images', 'videos', 'audio', 'pdf', 'zip'].map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                className={`btn-type-fichier ${recherche_type === t ? 'actif' : ''}`}
                                                onClick={() => setRechercheType(t)}
                                            >
                                                {t === 'tout' ? 'Tout' : t === 'images' ? 'Images' : t === 'videos' ? 'Vidéos' : t === 'audio' ? 'Audio' : t === 'pdf' ? 'PDF' : 'ZIP'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="recherche-actions">
                                    {recherche_active && (
                                        <button type="button" className="btn-annuler" onClick={reinitialiser}>Réinitialiser</button>
                                    )}
                                    <button type="submit" className="btn-confirmer" disabled={chargement_recherche}>
                                        {chargement_recherche ? <span className="spinner-recherche" /> : 'Rechercher'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {chargement_recherche ? (
                    <div className="dossier-vide">
                        <span className="spinner-recherche spinner-recherche-grand" />
                    </div>
                ) : allItems.length === 0 ? (
                    <div className="dossier-vide">
                        {recherche_active
                            ? <p>Aucun résultat pour cette recherche</p>
                            : <><p>Aucun dossier ou fichier pour le moment</p><p className="hint">Cliquez sur "Créer un dossier" ou "Publier un fichier"</p></>
                        }
                    </div>
                ) : (
                    <div className="dossiers-liste">
                        <div className="dossier-header-tableau">
                            <div className="col-checkbox">
                                <input 
                                    type="checkbox" 
                                    checked={toutEstSelectionne}
                                    onChange={() => toggleSelectionTout(displayItems.dossiers, displayItems.fichiers)}
                                    title="Sélectionner tout"
                                />
                            </div>
                            
                            <div className="col-nom tri" onClick={() => demanderTri('nom')}>
                                Nom {tri_config.cle === 'nom' && (tri_config.direction === 'asc' ? '↑' : '↓')}
                            </div>
                            <div className="col-extension tri" onClick={() => demanderTri('extension')}>
                                Extension {tri_config.cle === 'extension' && (tri_config.direction === 'asc' ? '↑' : '↓')}
                            </div>
                            <div className="col-date tri" onClick={() => demanderTri('dateCreation')}>
                                Créé le {tri_config.cle === 'dateCreation' && (tri_config.direction === 'asc' ? '↑' : '↓')}
                            </div>
                            <div className="col-date tri" onClick={() => demanderTri('modifieLe')}>
                                Modifié le {tri_config.cle === 'modifieLe' && (tri_config.direction === 'asc' ? '↑' : '↓')}
                            </div>
                            <div className="col-taille tri" onClick={() => demanderTri('taille')}>
                                Taille {tri_config.cle === 'taille' && (tri_config.direction === 'asc' ? '↑' : '↓')}
                            </div>
                            <div className="col-actions">
                                {selection.length > 0 && !estDansCorbeille && (
                                    <div className="actions-multiples">
                                        <button className="action-icon-btn action-danger" onClick={ouvrirModalSuppressionMultiple} title="Supprimer la sélection">🗑️</button>
                                        <button className="action-icon-btn action-primary" onClick={telechargerSelection} title="Télécharger la sélection en ZIP">⬇️</button>
                                        <button className="action-icon-btn action-primary" onClick={() => ouvrirModalDeplacement()} title="Déplacer la sélection">↪️</button>
                                    </div>
                                )}
                                {selection.length > 0 && estDansCorbeille && (
                                    <div className="actions-multiples">
                                        <button className="action-icon-btn action-primary" onClick={ouvrirModalRestaurerMultiple} title="Restaurer la sélection">♻️</button>
                                        <button className="action-icon-btn action-danger" onClick={ouvrirModalSuppressionDefinitiveMultiple} title="Supprimer définitivement la sélection">❌</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {dossiersTries.map((dossier) => (
                            <div
                                key={dossier.idDossier}
                                className={`dossier-ligne ${dossier_survole_upload === dossier.idDossier ? 'drag-over' : ''} ${estSelectionne(dossier, 'dossier') ? 'ligne-selectionnee' : ''}`}
                                onClick={() => gestionClicDossier(dossier)}
                                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDossierSurvoleUpload(dossier.idDossier); }}
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); if (!e.currentTarget.contains(e.relatedTarget)) setDossierSurvoleUpload(null); }}
                                onDrop={(e) => { e.stopPropagation(); handleDropGlobal(e, dossier.idDossier); }}
                            >
                                <div className="col-checkbox" onClick={(e) => e.stopPropagation()}>
                                    <input 
                                        type="checkbox" 
                                        checked={estSelectionne(dossier, 'dossier')}
                                        onChange={() => toggleSelection(dossier, 'dossier')}
                                    />
                                </div>
                                <div className="col-nom">
                                    <span>📁</span>
                                    <span className="dossier-nom" title={dossier.cheminDaccesDossier}>
                                        {tronquerNom(dossier.cheminDaccesDossier)}
                                    </span>
                                </div>
                                <div className="col-extension">dossier</div>
                                <div className="col-date">{new Date(dossier.dateCreation).toLocaleDateString('fr-FR')}</div>
                                <div className="col-date">{new Date(dossier.modifieLe).toLocaleDateString('fr-FR')}</div>
                                <div className="col-taille">{taille_dossiers[dossier.idDossier] !== undefined ? formatFileSize(taille_dossiers[dossier.idDossier]) : '...'}</div>
                                <div className="col-actions">
                                    {menu_options_dossier === dossier.idDossier && (
                                        <div className="actions-rapides" onClick={(e) => e.stopPropagation()}>
                                            {!estDansCorbeille ? (
                                                <>
                                                    <button className="action-icon-btn" onClick={() => partagerRessource({ id_dossier: dossier.idDossier })} title="Partager">🔗</button>
                                                    <button className="action-icon-btn" onClick={() => ouvrirModalRenommerDossier(dossier)} title="Renommer">✏️</button>
                                                    <button className="action-icon-btn" onClick={() => ouvrirModalDeplacement(dossier)} title="Déplacer">↪️</button>
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

                        {fichiersTries.map((fichier, index) => {
                            const { nomBase, extension } = separerNomExtension(fichier.nom);
                            const emojiFichier = obtenirEmojiFichier(fichier.nom);
                            return (
                                <div
                                    key={`file-${index}`}
                                    className={`dossier-ligne fichier-ligne ${estSelectionne(fichier, 'fichier') ? 'ligne-selectionnee' : ''}`}
                                    onClick={() => ouvrirApercu(fichier)}
                                    style={{ cursor: chargement_preview ? 'wait' : 'pointer' }}
                                >
                                    <div className="col-checkbox" onClick={(e) => e.stopPropagation()}>
                                        <input 
                                            type="checkbox" 
                                            checked={estSelectionne(fichier, 'fichier')}
                                            onChange={() => toggleSelection(fichier, 'fichier')}
                                        />
                                    </div>
                                    
                                    <div className="col-nom">
                                        <span>{emojiFichier}</span>
                                        <span className="dossier-nom" title={fichier.nom}>
                                            {tronquerNom(nomBase)}
                                        </span>
                                    </div>
                                    <div className="col-extension">{extension || 'fichier'}</div> 
                                    <div className="col-date">{new Date(fichier.dateCreation).toLocaleDateString('fr-FR')}</div>
                                    <div className="col-date">{new Date(fichier.dateModification).toLocaleDateString('fr-FR')}</div>
                                    <div className="col-taille">{formatFileSize(fichier.taille)}</div>
                                    <div className="col-actions">
                                        {menu_options_fichier === fichier.nom && (
                                            <div className="actions-rapides" onClick={(e) => e.stopPropagation()}>
                                                {!estDansCorbeille ? (
                                                    <>
                                                        <button className="action-icon-btn" onClick={() => partagerRessource({ id_dossier: id_dossier_courant, nom_fichier: fichier.nom })} title="Partager">🔗</button>
                                                        <button className="action-icon-btn" onClick={() => telechargerFichier(fichier)} title="Télécharger">⬇️</button>
                                                        <button className="action-icon-btn" onClick={() => ouvrirModalDeplacement(fichier)} title="Déplacer">↪️</button>
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
                            );
                        })}
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
                        <p className="taille-corbeille">{taille_dossiers[corbeille_info.idDossier] !== undefined ? formatFileSize(taille_dossiers[corbeille_info.idDossier]) : 'Calcul...'}</p>
                    </div>
                </div>
            )}

            {fichier_preview && (
                <div className="modal-overlay" onMouseDown={(e) => {
                    if (e.target === e.currentTarget) fermerApercu();
                }}>
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