import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Login.css';

function Login() {
    const [donneesFormulaire, setDonneesFormulaire] = useState({ email: '', mdp: '' });
    const [erreurConnexion, setErreurConnexion] = useState('');

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
            
            window.location.href = '/';
        } catch (erreur) {
            setErreurConnexion(erreur.response?.data?.message || 'Erreur de connexion au serveur');
        }
    };

    return (
    <div className="auth-form-container">
        <h2>Connexion</h2>
        <form onSubmit={gestionSoumission}>
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

            {erreurConnexion && (
                <div className="message-erreur">
                    {erreurConnexion}
                </div>
            )}

            <button type="submit" className="btn-submit">Se connecter</button>
        </form>
    </div>
    );
}

export default Login;