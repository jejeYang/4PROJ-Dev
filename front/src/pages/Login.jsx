import React, { useState } from 'react';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import '../styles/Login.css';

function Login() {
    const [donneesFormulaire, setDonneesFormulaire] = useState({ email: '', mdp: '' });
    const [erreurConnexion, setErreurConnexion] = useState('');
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '60122681226-56ehoh7uj46u1ot03dlct24srh1j83p0.apps.googleusercontent.com';

    const gestionChangement = (e) => {
        setDonneesFormulaire({ ...donneesFormulaire, [e.target.name]: e.target.value });
    };

    const gestionSoumission = async (e) => {
        e.preventDefault();
        setErreurConnexion('');
        try {
            const reponse = await axios.post('http://localhost:3000/api/login', donneesFormulaire);
            
            localStorage.setItem('token', reponse.data.token);
            localStorage.setItem('user', JSON.stringify(reponse.data.utilisateur));
            
            globalThis.location.href = '/';
        } catch (error_) {
            setErreurConnexion(error_.response?.data?.message || 'Erreur de connexion au serveur');
        }
    };

    const gererConnexionGoogle = async (credentialResponse) => {
        setErreurConnexion('');
        try {
            const reponse = await axios.post('http://localhost:3000/api/auth/google', {
                idToken: credentialResponse.credential,
            });

            localStorage.setItem('token', reponse.data.token);
            localStorage.setItem('user', JSON.stringify(reponse.data.utilisateur));

            globalThis.location.href = '/';
        } catch (error_) {
            setErreurConnexion(error_.response?.data?.message || 'Erreur de connexion Google');
        }
    };

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