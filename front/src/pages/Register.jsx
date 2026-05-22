import React from 'react';
import { useRegister } from '../hooks/useRegister';
import '../styles/Register.css';

function Register() {
    const {
        donneesFormulaire,
        erreurInscription,
        gestionChangement,
        gestionSoumission
    } = useRegister();

    return (
        <div className="auth-form-container">
            <h2>Créer un compte</h2>
            <form onSubmit={gestionSoumission}>
                <div className="form-group">
                    <label>Nom d'utilisateur</label>
                    <input 
                        type="text" 
                        name="nom" 
                        value={donneesFormulaire.nom} 
                        onChange={gestionChangement} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input 
                        type="email" 
                        name="email" 
                        value={donneesFormulaire.email} 
                        onChange={gestionChangement} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Mot de passe</label>
                    <input 
                        type="password" 
                        name="mdp" 
                        value={donneesFormulaire.mdp} 
                        onChange={gestionChangement} 
                        required 
                    />
                </div>

                {erreurInscription && (
                    <div className="message-erreur">
                        {erreurInscription}
                    </div>
                )}

                <button type="submit" className="btn-submit">S'inscrire</button>
            </form>
        </div>
    );
}

export default Register;