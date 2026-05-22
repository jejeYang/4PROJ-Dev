import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useLogin } from '../hooks/useLogin';
import '../styles/Login.css';

function Login() {
    const {
        donneesFormulaire,
        erreurConnexion,
        setErreurConnexion,
        googleClientId,
        gestionChangement,
        gestionSoumission,
        gererConnexionGoogle
    } = useLogin();

    return (
        <div className="auth-form-container">
            <h2>Connexion</h2>
            <form onSubmit={gestionSoumission}>
                <div className="form-group">
                    <label htmlFor="login-email">Email</label>
                    <input 
                        id="login-email"
                        type="email" 
                        name="email" 
                        value={donneesFormulaire.email} 
                        onChange={gestionChangement} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="login-mdp">Mot de passe</label>
                    <input 
                        id="login-mdp"
                        type="password" 
                        name="mdp" 
                        value={donneesFormulaire.mdp} 
                        onChange={gestionChangement} 
                        required 
                    />
                </div>

                {erreurConnexion && (
                    <div className="message-erreur">
                        {erreurConnexion}
                    </div>
                )}

                <button type="submit" className="btn-submit">Se connecter</button>

                <div className="google-separator">ou</div>
                {googleClientId ? (
                    <div className="google-login-wrapper">
                        <GoogleLogin
                            onSuccess={gererConnexionGoogle}
                            onError={() => setErreurConnexion('Connexion Google annulée ou impossible')}
                            text="signin_with"
                            shape="pill"
                        />
                    </div>
                ) : (
                    <div className="message-erreur">Google Auth non configuré côté front (VITE_GOOGLE_CLIENT_ID).</div>
                )}
            </form>
        </div>
    );
}

export default Login;