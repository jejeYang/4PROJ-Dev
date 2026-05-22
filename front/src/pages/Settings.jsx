import React, { useContext } from 'react';
import { Edit2, AlertTriangle } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { ThemeContext } from '../context/theme_context';
import '../styles/Settings.css';

function Settings() {
    const { toggle: est_sombre, toggleFunction: changerTheme } = useContext(ThemeContext);
    
    const {
        fileInputRef,
        nouvelleImagePreview,
        erreurImage, setErreurImage,
        afficherModalSuppression, setAfficherModalSuppression,
        motDePasseSuppression, setMotDePasseSuppression,
        utilisateur,
        donnees_formulaire,
        donnees_mot_de_passe,
        message_notification,
        gestionChangementProfil,
        gestionChangementMotDePasse,
        declencherSelectionFichier,
        gestionChangementImage,
        mettreAJourProfil,
        changerMotDePasse,
        confirmerSuppressionCompte
    } = useSettings();

    if (!utilisateur) return <div>Vous n'êtes pas connecté.</div>;

    const initialeAvatar = (utilisateur.nom || utilisateur.email || 'U').charAt(0).toUpperCase();

    return (
        <div className="conteneur-parametres">
            {afficherModalSuppression && (
                <div className="overlay-modal">
                    <div className="carte-parametres modal-danger">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertTriangle size={20} />
                            Action Irréversible
                        </h3>
                        <p>Attention : Toutes vos données seront définitivement effacées. Veuillez saisir votre mot de passe pour confirmer.</p>
                        <form onSubmit={confirmerSuppressionCompte}>
                            <div className="groupe-formulaire">
                                <input 
                                    type="password" 
                                    placeholder="Mot de passe de confirmation"
                                    value={motDePasseSuppression}
                                    onChange={(e) => setMotDePasseSuppression(e.target.value)}
                                    required 
                                    autoFocus
                                />
                            </div>
                            <div className="rangee-boutons-modal">
                                <button type="button" onClick={() => setAfficherModalSuppression(false)} className="btn-annuler">Annuler</button>
                                <button type="submit" className="btn-danger">Supprimer mon compte</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <header className="en-tete-parametres">
                <h1>Paramètres</h1>
                <p>Gérez vos informations personnelles</p>
            </header>

            {message_notification && <div className="notification-message">{message_notification}</div>}

            <div className="disposition-parametres">
                <div className="colonne-principale-parametres">
                    <section className="carte-parametres section-profil">
                        <div className="en-tete-visuel-profil">
                            <div className="conteneur-avatar-edition">
                                <div className="espace-avatar">
                                    {nouvelleImagePreview ? (
                                        <img src={nouvelleImagePreview} alt="Aperçu avatar" className="image-avatar-siteweb" />
                                    ) : (utilisateur.avatarUrl && !erreurImage) ? (
                                        <img 
                                            src={utilisateur.avatarUrl} 
                                            alt="Avatar utilisateur" 
                                            className="image-avatar-siteweb" 
                                            onError={() => setErreurImage(true)}
                                        />
                                    ) : (
                                        initialeAvatar
                                    )}
                                </div>
                                <div className="bouton-editer-avatar" onClick={declencherSelectionFichier} title="Changer la photo de profil">
                                    <Edit2 size={14} style={{ display: 'block' }} />
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    style={{ display: 'none' }} 
                                    accept="image/*" 
                                    onChange={gestionChangementImage}
                                />
                            </div>
                            <h3>Mon Profil</h3>
                        </div>
                        
                        <form onSubmit={mettreAJourProfil} className="formulaire-parametres">
                            <div className="groupe-formulaire">
                                <label>Nom d'utilisateur</label>
                                <input 
                                    type="text" 
                                    name="nom" 
                                    value={donnees_formulaire.nom} 
                                    onChange={gestionChangementProfil} 
                                    required 
                                />
                            </div>
                            <div className="groupe-formulaire">
                                <label>Email professionnel</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    value={donnees_formulaire.email} 
                                    onChange={gestionChangementProfil} 
                                    required 
                                />
                            </div>
                            <button type="submit" className="btn-mise-a-jour">Mettre à jour le profil</button>
                        </form>
                    </section>

                    <section className="carte-parametres">
                        <h3>Sécurité du mot de passe</h3>
                        <form onSubmit={changerMotDePasse} className="formulaire-parametres">
                            <div className="groupe-formulaire">
                                <label>Ancien mot de passe</label>
                                <input 
                                    type="password" 
                                    name="ancien_mot_de_passe" 
                                    value={donnees_mot_de_passe.ancien_mot_de_passe} 
                                    onChange={gestionChangementMotDePasse} 
                                    required 
                                />
                            </div>
                            <div className="rangee-groupe-formulaire">
                                <div className="groupe-formulaire">
                                    <label>Nouveau</label>
                                    <input 
                                        type="password" 
                                        name="nouveau_mot_de_passe" 
                                        value={donnees_mot_de_passe.nouveau_mot_de_passe} 
                                        onChange={gestionChangementMotDePasse} 
                                        required 
                                    />
                                </div>
                                <div className="groupe-formulaire">
                                    <label>Confirmation</label>
                                    <input 
                                        type="password" 
                                        name="confirmer_mot_de_passe" 
                                        value={donnees_mot_de_passe.confirmer_mot_de_passe} 
                                        onChange={gestionChangementMotDePasse} 
                                        required 
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn-mise-a-jour">Changer le mot de passe</button>
                        </form>
                    </section>
                </div>

                <div className="colonne-laterale-parametres">
                    <section className="carte-parametres zone-danger">
                        <h3>Zone de danger</h3>
                        <p>La suppression de votre compte est définitive. Toutes vos données seront effacées.</p>
                        <button onClick={() => setAfficherModalSuppression(true)} className="btn-danger">Supprimer mon compte</button>
                    </section>

                    <section className="carte-parametres changeur-theme">
                        <h3>Apparence</h3>
                        <div className="conteneur-bascule" onClick={changerTheme}>
                            <div className={`piste-bascule ${est_sombre ? 'actif' : ''}`}>
                                <div className="bille-bascule"></div>
                            </div>
                            <span>Thème {est_sombre ? 'Sombre' : 'Clair'}</span>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default Settings;