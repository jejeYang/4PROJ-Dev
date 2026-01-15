import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [formData, setFormData] = useState({ email: '', mdp: '' });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
        // Appel backend
        const response = await axios.post('http://localhost:3000/api/login', formData);
        
        // Stockage du token et de l'utilisateur
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.utilisateur));
        
        alert('Connexion réussie !');
        navigate('/');
        } catch (error) {
        alert('Erreur de connexion : ' + (error.response?.data?.message || error.message));
        }
    };

    return (
    <div className="auth-form-container">
        <h2>Connexion</h2>
        <form onSubmit={handleSubmit}>
        <div className="form-group">
            <label>Email</label>
            <input 
            type="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            required 
            />
        </div>
        <div className="form-group">
            <label>Mot de passe</label>
            <input 
            type="password" 
            name="mdp" 
            value={formData.mdp} 
            onChange={handleChange} 
            required 
            />
        </div>
        <button type="submit" className="btn-submit">Se connecter</button>
        </form>
    </div>
    );
}

export default Login;