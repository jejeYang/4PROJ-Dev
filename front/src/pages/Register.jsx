import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Register.css';

function Register() {
    const [donneesFormulaire, setDonneesFormulaire] = useState({ 
        nom: '', 
        email: '', 
        mdp: ''
    });
    const [erreurInscription, setErreurInscription] = useState('');
    const naviguer = useNavigate();

    const gestionChangement = (e) => {
        setDonneesFormulaire({ ...donneesFormulaire, [e.target.name]: e.target.value });
    };

    const gestionSoumission = async (e) => {
        e.preventDefault();
        setErreurInscription('');
        try {
            await axios.post('http://localhost:3000/api/register', donneesFormulaire);
            naviguer('/login');
        } catch (erreur) {
            setErreurInscription(erreur.response?.data?.message || 'Erreur lors de l\'inscription');
        }
    };

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