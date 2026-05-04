import React, { useState } from 'react';
import axios from 'axios';
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
        naviguerVersUpload, handleDragEnterGlobal, handleDragLeaveGlobal, handleDragOverGlobal, handleDropGlobal,
        gestionClicDossier, gestionClicBreadcrumb,
        selection, estSelectionne, toggleSelection, toggleSelectionTout,
        ouvrirModalSuppressionMultiple, supprimerSelection, telechargerSelection, action_en_cours,
        ouvrirModalRestaurerMultiple, restaurerSelection,
        ouvrirModalSuppressionDefinitiveMultiple, supprimerDefinitivementSelection,
        gestionCreeDossier,
        ouvrirModalRenommerDossier, confirmerRenommageDossier,
        ouvrirModalSuppressionDossier,
        ouvrirModalSuppressionDefinitiveDossier, confirmerSuppressionDefinitiveDossier,
        restaurerDossier,
        ouvrirModalViderCorbeille, confirmerViderCorbeille,
        telechargerFichier, restaurerFichier,
        ouvrirModalSuppressionFichier,
        ouvrirModalSuppressionDefinitiveFichier, confirmerSuppressionDefinitiveFichier,
        ouvrirApercu, fermerApercu,
        ouvrirModalDeplacement, naviguerDeplacement, confirmerDeplacement,
        lancerRecherche, reinitialiserRecherche,
        recherche_active, resultats_recherche, chargement_recherche,
        formatFileSize, tronquerNom, separerNomExtension,
    } = useDashboard();

    const [modal_recherche_ouverte, setModalRechercheOuverte] = useState(false);
    const [recherche_query, setRechercheQuery] = useState('');
    const [recherche_type, setRechercheType] = useState('tout');

    const [shareMessage, setShareMessage] = useState('');
    const [shareFormOpen, setShareFormOpen] = useState(false);
    const [shareFormTarget, setShareFormTarget] = useState(null);
    const [shareFormData, setShareFormData] = useState({
        email: '',
        motDePasse: '',
        dateExpiration: ''
    });
    const [shareFormEmailExists, setShareFormEmailExists] = useState(null);
    const [shareFormLoading, setShareFormLoading] = useState(false);

    if (loading) {
        return <div className="dashboard-container">Chargement...</div>;
    }

    const id_dossier_courant = dossier_actuel
        ? dossier_actuel.idDossier
        : dossier_racine?.idDossier;

    const displayItems = recherche_active
        ? {
            dossiers: (resultats_recherche.dossiers || []).filter(
                d => d.idDossierParent === id_dossier_courant
            ),
            fichiers: (resultats_recherche.fichiers || []).filter(
                f => f.idDossier === id_dossier_courant
            )
        }
        : dossier_actuel
            ? {
                dossiers: contenu_dossier.dossiers || [],
                fichiers: contenu_dossier.fichiers || []
            }
            : {
                dossiers,
                fichiers: fichiers_base
            };

    const allItems = [...displayItems.dossiers, ...displayItems.fichiers];
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

    const verifierEmailCompte = async (email) => {
        if (!email) {
            setShareFormEmailExists(null);
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setShareFormEmailExists(null);
            return false;
        }

        try {
            const response = await axios.get('http://localhost:3000/api/comptes/check-email', {
                params: { email }
            });

            const exists = response.data?.exists === true;
            setShareFormEmailExists(exists);

            if (exists) {
                setShareFormData(prev => ({
                    ...prev,
                    motDePasse: ''
                }));
            }

            return exists;
        } catch (err) {
            console.error('Erreur lors de la vérification de l’email :', err);
            setShareFormEmailExists(null);
            return false;
        }
    };

    const handleShareEmailChange = (email) => {
        setShareFormData(prev => ({
            ...prev,
            email,
            motDePasse: ''
        }));
        setShareFormEmailExists(null);
    };

    const handleShareEmailBlur = async () => {
        await verifierEmailCompte(shareFormData.email);
    };

    const partagerRessource = ({ dossierId, fileName }) => {
        if (!dossierId) {
            setError('Impossible de déterminer le dossier à partager.');
            return;
        }

        setError('');
        setShareFormTarget({ dossierId, fileName });
        setShareFormData({
            email: '',
            motDePasse: '',
            dateExpiration: ''
        });
        setShareFormEmailExists(null);
        setShareFormOpen(true);
    };

    const soumettrFormulairePartage = async (e) => {
        e.preventDefault();

        if (!shareFormTarget?.dossierId) {
            setError('Impossible de déterminer la ressource à partager.');
            return;
        }

        if (!shareFormData.email) {
            setError('Email requis pour le partage.');
            return;
        }

        const emailExists = await verifierEmailCompte(shareFormData.email);

        if (emailExists && shareFormData.motDePasse) {
            setError('Le mot de passe ne peut être utilisé que pour une adresse non enregistrée.');
            return;
        }

        setShareFormLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');

            const body = {
                email: shareFormData.email
            };

            if (shareFormTarget.fileName) {
                body.fileName = shareFormTarget.fileName;
            }

            if (shareFormData.motDePasse) {
                body.motDePasse = shareFormData.motDePasse;
            }

            if (shareFormData.dateExpiration) {
                body.dateExpiration = shareFormData.dateExpiration;
            }

            const response = await axios.post(
                `http://localhost:3000/api/dossiers/${shareFormTarget.dossierId}/partager`,
                body,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const lien = response.data?.lien?.url;
            const message = lien
                ? `Lien de partage créé : ${window.location.origin}${lien}`
                : 'Partage effectué avec succès.';

            setShareMessage(message);
            setShareFormOpen(false);
            setShareFormTarget(null);
            window.alert(message);
        } catch (err) {
            console.error('Erreur lors du partage :', err);
            setError(err.response?.data?.error || 'Erreur lors du partage.');
        } finally {
            setShareFormLoading(false);
        }
    };

    const fermerFormulairePartage = () => {
        setShareFormOpen(false);
        setShareFormTarget(null);
        setShareFormData({
            email: '',
            motDePasse: '',
            dateExpiration: ''
        });
        setShareFormEmailExists(null);
    };

    return (
        <div
            className="dashboard-container"
            onDragEnter={handleDragEnterGlobal}
            onDragOver={handleDragOverGlobal}
            onDragLeave={handleDragLeaveGlobal}
            onDrop={(e) => handleDropGlobal(e)}
            onClick={() => {
                setMenuOptionsDossier(null);
                setMenuOptionsFichier(null);
            }}
        >
            {etat_survole_upload && !dossier_survole_upload && (
                <div className="dashboard-drag-overlay" />
            )}

            <div className="dashboard-header">
                <div>
                    <h1>Mon Espace</h1>

                    {fil_ariane.length > 0 && (
                        <nav className="breadcrumb" aria-label="Fil d’ariane">
                            <button
                                className="breadcrumb-objet"
                                onClick={() => gestionClicBreadcrumb(-1)}
                            >
                                Mon Espace
                            </button>

                            {fil_ariane.map((dossier, index) => (
                                <React.Fragment key={dossier.idDossier}>
                                    <span className="breadcrumb-separateur">›</span>
                                    <button
                                        className="breadcrumb-objet"
                                        onClick={() => gestionClicBreadcrumb(index)}
                                    >
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
                            <button
                                className="btn-publie-dashboard-header"
                                onClick={naviguerVersUpload}
                            >
                                Publier un fichier
                            </button>

                            <button
                                className="btn-cree-dossier-dashboard-header"
                                onClick={() => {
                                    setChangeNomDossier('');
                                    setError('');
                                    setOuvreModal({ type: 'creation-dossier', data: null });
                                }}
                            >
                                Créer un dossier
                            </button>
                        </>
                    ) : (
                        <button
                            className="btn-cree-dossier-dashboard-header"
                            onClick={ouvrirModalViderCorbeille}
                        >
                            Vider la corbeille
                        </button>
                    )}
                </div>
            </div>

            {error && !ouvre_modal.type && !shareFormOpen && (
                <div className="dashboard-erreur-globale">
                    <span>{error}</span>
                    <button
                        className="btn-fermer-erreur"
                        onClick={() => setError('')}
                        title="Fermer"
                    >
                        ✕
                    </button>
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
                        <p
                            style={{
                                textAlign: 'center',
                                marginTop: '10px',
                                color: 'var(--text-primary-color)'
                            }}
                        >
                            {action_en_cours.progression}%
                        </p>
                    </div>
                </div>
            )}

            {ouvre_modal.type && !action_en_cours.active && (
                <div
                    className="modal-overlay"
                    onClick={() => !creating && setOuvreModal({ type: null, data: null })}
                >
                    <div className="modal-contenu" onClick={e => e.stopPropagation()}>

                        {ouvre_modal.type === 'creation-dossier' && (
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
                                    <button
                                        type="button"
                                        className="btn-annuler"
                                        onClick={() => setOuvreModal({ type: null, data: null })}
                                        disabled={creating}
                                    >
                                        Annuler
                                    </button>

                                    <button
                                        type="submit"
                                        className="btn-confirmer"
                                        disabled={creating}
                                    >
                                        {creating ? 'Création...' : 'Créer'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {ouvre_modal.type === 'renommage-dossier' && (
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
                                            confirmerRenommageDossier();
                                        }
                                    }}
                                />

                                {error && <p className="erreur-modale">{error}</p>}

                                <div className="modal-bouttons">
                                    <button
                                        className="btn-annuler"
                                        onClick={() => setOuvreModal({ type: null, data: null })}
                                    >
                                        Annuler
                                    </button>

                                    <button
                                        className="btn-confirmer"
                                        onClick={confirmerRenommageDossier}
                                    >
                                        Sauvegarder
                                    </button>
                                </div>
                            </div>
                        )}

                        {ouvre_modal.type === 'deplacement' && (
                            <div>
                                <h3>Déplacer {ouvre_modal.data.length} élément(s)</h3>
                                <p>
                                    Destination actuelle : {
                                        dossier_cible_deplacement
                                            ? dossier_cible_deplacement.cheminDaccesDossier
                                            : 'Mon Espace'
                                    }
                                </p>

                                <div className="modal-navigateur-deplacement">
                                    <div className="modal-fil-ariane">
                                        <span
                                            className="modal-lien-ariane"
                                            onClick={() => naviguerDeplacement(null)}
                                        >
                                            Mon Espace
                                        </span>

                                        {chemin_deplacement.map((dossier, index) => (
                                            <React.Fragment key={dossier.idDossier}>
                                                <span className="separateur">›</span>
                                                <span
                                                    className="modal-lien-ariane"
                                                    onClick={() => naviguerDeplacement(dossier, index)}
                                                >
                                                    {dossier.cheminDaccesDossier}
                                                </span>
                                            </React.Fragment>
                                        ))}
                                    </div>

                                    {sous_dossiers_deplacement.length > 0 && (
                                        <select
                                            className="modal-select-deplacement"
                                            onChange={(e) => {
                                                const dossier_trouve = sous_dossiers_deplacement.find(
                                                    d => String(d.idDossier) === String(e.target.value)
                                                );

                                                if (dossier_trouve) {
                                                    naviguerDeplacement(dossier_trouve);
                                                }

                                                e.target.value = '';
                                            }}
                                        >
                                            <option value="">+ Entrer dans un sous-dossier...</option>

                                            {sous_dossiers_deplacement.map((dossier) => (
                                                <option
                                                    key={dossier.idDossier}
                                                    value={dossier.idDossier}
                                                >
                                                    {dossier.cheminDaccesDossier}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {error && <p className="erreur-modale suppression">{error}</p>}

                                <div className="modal-bouttons">
                                    <button
                                        className="btn-annuler"
                                        onClick={() => setOuvreModal({ type: null, data: null })}
                                    >
                                        Annuler
                                    </button>

                                    <button
                                        className="btn-confirmer"
                                        onClick={confirmerDeplacement}
                                    >
                                        Déplacer ici
                                    </button>
                                </div>
                            </div>
                        )}

                        {ouvre_modal.type === 'confirmation-suppression-multiple' && (
                            <div>
                                <h3>Déplacer vers la corbeille ?</h3>
                                <p>
                                    Voulez-vous vraiment déplacer les{' '}
                                    <strong>{ouvre_modal.data}</strong>{' '}
                                    éléments sélectionnés vers la corbeille ?
                                </p>

                                {error && <p className="erreur-modale suppression">{error}</p>}

                                <div className="modal-bouttons">
                                    <button
                                        className="btn-annuler"
                                        onClick={() => setOuvreModal({ type: null, data: null })}
                                    >
                                        Annuler
                                    </button>

                                    <button
                                        className="btn-confirmer"
                                        onClick={supprimerSelection}
                                    >
                                        Déplacer
                                    </button>
                                </div>
                            </div>
                        )}

                        {ouvre_modal.type === 'confirmation-suppression-dossier' && (
                            <div>
                                <h3>Supprimer définitivement ?</h3>
                                <p>
                                    Voulez-vous vraiment supprimer le dossier
                                    "{ouvre_modal.data?.cheminDaccesDossier}" ?
                                    Cette action est irréversible.
                                </p>

                                {error && <p className="erreur-modale suppression">{error}</p>}

                                <div className="modal-bouttons">
                                    <button
                                        className="btn-annuler"
                                        onClick={() => setOuvreModal({ type: null, data: null })}
                                    >
                                        Annuler
                                    </button>

                                    <button
                                        className="btn-confirmer"
                                        onClick={confirmerSuppressionDefinitiveDossier}
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        )}

                        {ouvre_modal.type === 'confirmation-suppression-fichier' && (
                            <div>
                                <h3>Supprimer définitivement ?</h3>
                                <p>
                                    Voulez-vous vraiment supprimer le fichier
                                    "{ouvre_modal.data?.nom}" ?
                                    Cette action est irréversible.
                                </p>

                                {error && <p className="erreur-modale suppression">{error}</p>}

                                <div className="modal-bouttons">
                                    <button
                                        className="btn-annuler"
                                        onClick={() => setOuvreModal({ type: null, data: null })}
                                    >
                                        Annuler
                                    </button>

                                    <button
                                        className="btn-confirmer"
                                        onClick={confirmerSuppressionDefinitiveFichier}
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        )}

                        {ouvre_modal.type === 'confirmation-restauration-multiple' && (
                            <div>
                                <h3>Restaurer la sélection ?</h3>
                                <p>
                                    Voulez-vous vraiment restaurer les{' '}
                                    <strong>{ouvre_modal.data}</strong>{' '}
                                    éléments sélectionnés vers leurs emplacements d'origine ?
                                </p>

                                {error && <p className="erreur-modale suppression">{error}</p>}

                                <div className="modal-bouttons">
                                    <button
                                        className="btn-annuler"
                                        onClick={() => setOuvreModal({ type: null, data: null })}
                                    >
                                        Annuler
                                    </button>

                                    <button
                                        className="btn-confirmer"
                                        onClick={restaurerSelection}
                                    >
                                        Restaurer
                                    </button>
                                </div>
                            </div>
                        )}

                        {ouvre_modal.type === 'confirmation-suppression-definitive-multiple' && (
                            <div>
                                <h3>Supprimer définitivement ?</h3>
                                <p>
                                    Voulez-vous vraiment supprimer définitivement les{' '}
                                    <strong>{ouvre_modal.data}</strong>{' '}
                                    éléments sélectionnés ? Cette action est irréversible.
                                </p>

                                {error && <p className="erreur-modale suppression">{error}</p>}

                                <div className="modal-bouttons">
                                    <button
                                        className="btn-annuler"
                                        onClick={() => setOuvreModal({ type: null, data: null })}
                                    >
                                        Annuler
                                    </button>

                                    <button
                                        className="btn-confirmer"
                                        style={{ backgroundColor: 'var(--error-color)' }}
                                        onClick={supprimerDefinitivementSelection}
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </div>
                        )}

                        {ouvre_modal.type === 'vidage-corbeille' && (
                            <div>
                                <h3>Vider la corbeille ?</h3>
                                <p>
                                    Tous les éléments présents dans la corbeille seront
                                    définitivement supprimés.
                                </p>

                                {error && <p className="erreur-modale suppression">{error}</p>}

                                <div className="modal-bouttons">
                                    <button
                                        className="btn-annuler"
                                        onClick={() => setOuvreModal({ type: null, data: null })}
                                    >
                                        Annuler
                                    </button>

                                    <button
                                        className="btn-confirmer"
                                        onClick={confirmerViderCorbeille}
                                    >
                                        Vider
                                    </button>
                                </div>
                            </div>
                        )}

                        {ouvre_modal.type === 'suppression-dossier' && (
                            <div>
                                <h3>Déplacement en cours...</h3>
                                <p>
                                    Déplacement du dossier
                                    "{ouvre_modal.data?.cheminDaccesDossier}" vers la corbeille
                                </p>
                            </div>
                        )}

                        {ouvre_modal.type === 'suppression-reussie-dossier' && (
                            <div>
                                <h3>Dossier déplacé</h3>
                                <p>
                                    Dossier "{ouvre_modal.data?.cheminDaccesDossier}"
                                    déplacé vers la corbeille
                                </p>

                                <div className="modal-bouttons">
                                    <button
                                        className="btn-confirmer"
                                        onClick={() => setOuvreModal({ type: null, data: null })}
                                    >
                                        OK
                                    </button>
                                </div>
                            </div>
                        )}

                        {ouvre_modal.type === 'suppression-fichier' && (
                            <div>
                                <h3>Déplacement en cours...</h3>
                                <p>
                                    Déplacement du fichier "{ouvre_modal.data?.nom}"
                                    vers la corbeille
                                </p>
                            </div>
                        )}

                        {ouvre_modal.type === 'suppression-reussie-fichier' && (
                            <div>
                                <h3>Fichier déplacé</h3>
                                <p>
                                    Fichier "{ouvre_modal.data?.nom}"
                                    déplacé vers la corbeille
                                </p>

                                <div className="modal-bouttons">
                                    <button
                                        className="btn-confirmer"
                                        onClick={() => setOuvreModal({ type: null, data: null })}
                                    >
                                        OK
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {shareFormOpen && (
                <div className="modal-overlay" onClick={fermerFormulairePartage}>
                    <div className="modal-contenu" onClick={e => e.stopPropagation()}>
                        <h3>Partager une ressource</h3>

                        <form onSubmit={soumettrFormulairePartage}>
                            <div className="form-group">
                                <label htmlFor="share-email">Email</label>
                                <input
                                    id="share-email"
                                    type="email"
                                    placeholder="adresse@email.com"
                                    value={shareFormData.email}
                                    onChange={(e) => handleShareEmailChange(e.target.value)}
                                    onBlur={handleShareEmailBlur}
                                    required
                                />
                            </div>

                            {shareFormEmailExists === true && (
                                <p className="info-modale">
                                    Cet email correspond à un utilisateur existant.
                                    Le partage sera effectué directement dans sa racine.
                                </p>
                            )}

                            {shareFormEmailExists === false && (
                                <p className="info-modale">
                                    Aucun compte trouvé. Un lien de partage sera créé
                                    et vous pouvez définir un mot de passe.
                                </p>
                            )}

                            <div className="form-group">
                                <label htmlFor="share-password">Mot de passe optionnel</label>
                                <input
                                    id="share-password"
                                    type="password"
                                    placeholder="Laisser vide si aucun"
                                    value={shareFormData.motDePasse}
                                    onChange={(e) => setShareFormData({
                                        ...shareFormData,
                                        motDePasse: e.target.value
                                    })}
                                    disabled={shareFormEmailExists === true}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="share-expiry">Date d'expiration optionnelle</label>
                                <input
                                    id="share-expiry"
                                    type="datetime-local"
                                    value={shareFormData.dateExpiration}
                                    onChange={(e) => setShareFormData({
                                        ...shareFormData,
                                        dateExpiration: e.target.value
                                    })}
                                />
                            </div>

                            {error && <p className="erreur-modale">{error}</p>}

                            <div className="modal-bouttons">
                                <button
                                    type="button"
                                    className="btn-annuler"
                                    onClick={fermerFormulairePartage}
                                    disabled={shareFormLoading}
                                >
                                    Annuler
                                </button>

                                <button
                                    type="submit"
                                    className="btn-confirmer"
                                    disabled={shareFormLoading}
                                >
                                    {shareFormLoading ? 'Partage en cours...' : 'Partager'}
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

                    <button
                        className="btn-recherche"
                        style={
                            recherche_active
                                ? {
                                    backgroundColor: 'var(--select-primary-color)',
                                    borderColor: 'var(--btn-primary-color)'
                                }
                                : {}
                        }
                        onClick={() => setModalRechercheOuverte(true)}
                        title="Rechercher"
                    >
                        🔍
                    </button>
                </div>

                {shareMessage && (
                    <p className="share-message">{shareMessage}</p>
                )}

                {modal_recherche_ouverte && (
                    <div
                        className="modal-overlay"
                        onClick={() => setModalRechercheOuverte(false)}
                    >
                        <div
                            className="modal-contenu modal-recherche"
                            onClick={e => e.stopPropagation()}
                        >
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
                                        {['tout', 'images', 'videos', 'audio', 'pdf', 'zip'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                className={`btn-type-fichier ${recherche_type === type ? 'actif' : ''}`}
                                                onClick={() => setRechercheType(type)}
                                            >
                                                {type === 'tout'
                                                    ? 'Tout'
                                                    : type === 'images'
                                                        ? 'Images'
                                                        : type === 'videos'
                                                            ? 'Vidéos'
                                                            : type === 'audio'
                                                                ? 'Audio'
                                                                : type === 'pdf'
                                                                    ? 'PDF'
                                                                    : 'ZIP'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="recherche-actions">
                                    {recherche_active && (
                                        <button
                                            type="button"
                                            className="btn-annuler"
                                            onClick={reinitialiser}
                                        >
                                            Réinitialiser
                                        </button>
                                    )}

                                    <button
                                        type="submit"
                                        className="btn-confirmer"
                                        disabled={chargement_recherche}
                                    >
                                        {chargement_recherche
                                            ? <span className="spinner-recherche" />
                                            : 'Rechercher'}
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
                        {recherche_active ? (
                            <p>Aucun résultat pour cette recherche</p>
                        ) : (
                            <>
                                <p>Aucun dossier ou fichier pour le moment</p>
                                <p className="hint">
                                    Cliquez sur "Créer un dossier" ou "Publier un fichier"
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="dossiers-liste">
                        <div className="dossier-header-tableau">
                            <div className="col-checkbox">
                                <input
                                    type="checkbox"
                                    checked={toutEstSelectionne}
                                    onChange={() => toggleSelectionTout(
                                        displayItems.dossiers,
                                        displayItems.fichiers
                                    )}
                                    title="Sélectionner tout"
                                />
                            </div>

                            <div className="col-nom">Nom</div>
                            <div className="col-extension">Extension</div>
                            <div className="col-id">ID</div>
                            <div className="col-taille">Taille</div>

                            <div className="col-actions">
                                {selection.length > 0 && !estDansCorbeille && (
                                    <div className="actions-multiples">
                                        <button
                                            className="action-icon-btn action-danger"
                                            onClick={ouvrirModalSuppressionMultiple}
                                            title="Supprimer la sélection"
                                        >
                                            🗑️
                                        </button>

                                        <button
                                            className="action-icon-btn action-primary"
                                            onClick={telechargerSelection}
                                            title="Télécharger la sélection en ZIP"
                                        >
                                            ⬇️
                                        </button>

                                        <button
                                            className="action-icon-btn action-primary"
                                            onClick={() => ouvrirModalDeplacement()}
                                            title="Déplacer la sélection"
                                        >
                                            ↪️
                                        </button>
                                    </div>
                                )}

                                {selection.length > 0 && estDansCorbeille && (
                                    <div className="actions-multiples">
                                        <button
                                            className="action-icon-btn action-primary"
                                            onClick={ouvrirModalRestaurerMultiple}
                                            title="Restaurer la sélection"
                                        >
                                            ♻️
                                        </button>

                                        <button
                                            className="action-icon-btn action-danger"
                                            onClick={ouvrirModalSuppressionDefinitiveMultiple}
                                            title="Supprimer définitivement la sélection"
                                        >
                                            ❌
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {displayItems.dossiers.map((dossier) => (
                            <div
                                key={dossier.idDossier}
                                className={`dossier-ligne ${dossier_survole_upload === dossier.idDossier ? 'drag-over' : ''} ${estSelectionne(dossier, 'dossier') ? 'ligne-selectionnee' : ''}`}
                                onClick={() => gestionClicDossier(dossier)}
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
                                <div
                                    className="col-checkbox"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <input
                                        type="checkbox"
                                        checked={estSelectionne(dossier, 'dossier')}
                                        onChange={() => toggleSelection(dossier, 'dossier')}
                                    />
                                </div>

                                <div className="col-nom">
                                    <span>📁</span>
                                    <span
                                        className="dossier-nom"
                                        title={dossier.cheminDaccesDossier}
                                    >
                                        {tronquerNom(dossier.cheminDaccesDossier)}
                                    </span>
                                </div>

                                <div className="col-extension">dossier</div>
                                <div className="col-id">ID: {dossier.idDossier}</div>
                                <div className="col-taille">
                                    {taille_dossiers[dossier.idDossier] !== undefined
                                        ? formatFileSize(taille_dossiers[dossier.idDossier])
                                        : '...'}
                                </div>

                                <div className="col-actions">
                                    {menu_options_dossier === dossier.idDossier && (
                                        <div
                                            className="actions-rapides"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {!estDansCorbeille ? (
                                                <>
                                                    <button
                                                        className="action-icon-btn"
                                                        onClick={() => partagerRessource({
                                                            dossierId: dossier.idDossier
                                                        })}
                                                        title="Partager"
                                                    >
                                                        🔗
                                                    </button>

                                                    <button
                                                        className="action-icon-btn"
                                                        onClick={() => ouvrirModalRenommerDossier(dossier)}
                                                        title="Renommer"
                                                    >
                                                        ✏️
                                                    </button>

                                                    <button
                                                        className="action-icon-btn"
                                                        onClick={() => ouvrirModalDeplacement(dossier)}
                                                        title="Déplacer"
                                                    >
                                                        ↪️
                                                    </button>

                                                    <button
                                                        className="action-icon-btn"
                                                        onClick={() => ouvrirModalSuppressionDossier(dossier)}
                                                        title="Déplacer vers la corbeille"
                                                    >
                                                        🗑️
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        className="action-icon-btn"
                                                        onClick={() => restaurerDossier(dossier)}
                                                        title="Restaurer le dossier"
                                                    >
                                                        ♻️
                                                    </button>

                                                    <button
                                                        className="action-icon-btn"
                                                        onClick={() => ouvrirModalSuppressionDefinitiveDossier(dossier)}
                                                        title="Supprimer définitivement"
                                                    >
                                                        ❌
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    <button
                                        className="options-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOptionsDossier(
                                                menu_options_dossier === dossier.idDossier
                                                    ? null
                                                    : dossier.idDossier
                                            );
                                        }}
                                        title="Options"
                                    >
                                        ⋮
                                    </button>
                                </div>
                            </div>
                        ))}

                        {displayItems.fichiers.map((fichier, index) => {
                            const { nomBase, extension } = separerNomExtension(fichier.nom);

                            return (
                                <div
                                    key={`file-${fichier.idFichier || fichier.nom || index}`}
                                    className={`dossier-ligne fichier-ligne ${estSelectionne(fichier, 'fichier') ? 'ligne-selectionnee' : ''}`}
                                    onClick={() => ouvrirApercu(fichier)}
                                    style={{ cursor: chargement_preview ? 'wait' : 'pointer' }}
                                >
                                    <div
                                        className="col-checkbox"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={estSelectionne(fichier, 'fichier')}
                                            onChange={() => toggleSelection(fichier, 'fichier')}
                                        />
                                    </div>

                                    <div className="col-nom">
                                        <span>📄</span>
                                        <span className="dossier-nom" title={fichier.nom}>
                                            {tronquerNom(nomBase)}
                                        </span>
                                    </div>

                                    <div className="col-extension">
                                        {extension || 'fichier'}
                                    </div>

                                    <div className="col-id">
                                        {new Date(fichier.dateModification).toLocaleDateString('fr-FR')}
                                    </div>

                                    <div className="col-taille">
                                        {formatFileSize(fichier.taille)}
                                    </div>

                                    <div className="col-actions">
                                        {menu_options_fichier === fichier.nom && (
                                            <div
                                                className="actions-rapides"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {!estDansCorbeille ? (
                                                    <>
                                                        <button
                                                            className="action-icon-btn"
                                                            onClick={() => partagerRessource({
                                                                dossierId: id_dossier_courant,
                                                                fileName: fichier.nom
                                                            })}
                                                            title="Partager"
                                                        >
                                                            🔗
                                                        </button>

                                                        <button
                                                            className="action-icon-btn"
                                                            onClick={() => telechargerFichier(fichier)}
                                                            title="Télécharger"
                                                        >
                                                            ⬇️
                                                        </button>

                                                        <button
                                                            className="action-icon-btn"
                                                            onClick={() => ouvrirModalDeplacement(fichier)}
                                                            title="Déplacer"
                                                        >
                                                            ↪️
                                                        </button>

                                                        <button
                                                            className="action-icon-btn"
                                                            onClick={() => ouvrirModalSuppressionFichier(fichier)}
                                                            title="Déplacer vers la corbeille"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="action-icon-btn"
                                                            onClick={() => restaurerFichier(fichier)}
                                                            title="Restaurer le fichier"
                                                        >
                                                            ♻️
                                                        </button>

                                                        <button
                                                            className="action-icon-btn"
                                                            onClick={() => ouvrirModalSuppressionDefinitiveFichier(fichier)}
                                                            title="Supprimer définitivement"
                                                        >
                                                            ❌
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        <button
                                            className="options-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMenuOptionsFichier(
                                                    menu_options_fichier === fichier.nom
                                                        ? null
                                                        : fichier.nom
                                                );
                                            }}
                                            title="Options"
                                        >
                                            ⋮
                                        </button>
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
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                gestionClicDossier(corbeille_info);
                            }
                        }}
                        aria-label="Ouvrir la corbeille"
                    >
                        <div className="icone-corbeille">🗑️</div>
                        <h3>Corbeille</h3>

                        <p className="taille-corbeille">
                            {taille_dossiers[corbeille_info.idDossier] !== undefined
                                ? formatFileSize(taille_dossiers[corbeille_info.idDossier])
                                : 'Calcul...'}
                        </p>
                    </div>
                </div>
            )}

            {fichier_preview && (
                <div className="modal-overlay" onClick={fermerApercu}>
                    <div
                        className="modal-preview-contenu"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="preview-header">
                            <h3>{fichier_preview.nom}</h3>
                            <button
                                className="btn-fermer-preview"
                                onClick={fermerApercu}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="preview-body">
                            {fichier_preview.type === 'image' && (
                                <img src={fichier_preview.url} alt={fichier_preview.nom} />
                            )}

                            {fichier_preview.type === 'video' && (
                                <video controls autoPlay src={fichier_preview.url} />
                            )}

                            {fichier_preview.type === 'audio' && (
                                <audio controls autoPlay src={fichier_preview.url} />
                            )}

                            {fichier_preview.type === 'document' && (
                                <iframe src={fichier_preview.url} title={fichier_preview.nom} />
                            )}

                            {(fichier_preview.type === 'non_supporte' || fichier_preview.type === 'unsupported') && (
                                <div>
                                    L'affichage de ce type de fichier n'est pas supporté.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;