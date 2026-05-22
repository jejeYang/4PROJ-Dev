import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export function useLogin() {
    const navigate = useNavigate();
    const [donneesFormulaire, setDonneesFormulaire] = useState({ email: '', mdp: '' });
    const [erreurConnexion, setErreurConnexion] = useState('');
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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
            
            window.dispatchEvent(new Event('profilMisAJour'));
            navigate('/dashboard');
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

            window.dispatchEvent(new Event('profilMisAJour'));
            navigate('/dashboard');
        } catch (error_) {
            setErreurConnexion(error_.response?.data?.message || 'Erreur de connexion Google');
        }
    };

    return {
        donneesFormulaire,
        erreurConnexion,
        setErreurConnexion,
        googleClientId,
        gestionChangement,
        gestionSoumission,
        gererConnexionGoogle
    };
}
