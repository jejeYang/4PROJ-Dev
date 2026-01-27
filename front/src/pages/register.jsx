import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/register.css';

function Register() {
    const [formData, setFormData] = useState({ 
        nom: '', 
        email: '', 
        mdp: ''
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            /*A MODIFIER*/
        await axios.post('http://localhost:3000/api/users', formData);
        alert('Compte créé avec succès ! Veuillez vous connecter.');
        navigate('/login');
        } catch (error) {
        console.error(error);
        alert('Erreur lors de l\'inscription');
        }
    };

    return (
        <div className="auth-form-container">
        <h2>Créer un compte</h2>
        <form onSubmit={handleSubmit}>
            <div className="form-group">
            <label>Nom d'utilisateur</label>
            <input 
                type="text" 
                name="nom" 
                value={formData.nom} 
                onChange={handleChange} 
                required 
            />
            </div>
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
            <button type="submit" className="btn-submit">S'inscrire</button>
        </form>
        </div>
    );
}

export default Register;