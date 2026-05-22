import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export function useRegister() {
    const navigate = useNavigate();
    const [donneesFormulaire, setDonneesFormulaire] = useState({ 
        nom: '', 
        email: '', 
        mdp: ''
    });
    const [erreurInscription, setErreurInscription] = useState('');

    const gestionChangement = (e) => {
        setDonneesFormulaire({ ...donneesFormulaire, [e.target.name]: e.target.value });
    };

    const gestionSoumission = async (e) => {
        e.preventDefault();
        setErreurInscription('');
        try {
            await axios.post('http://localhost:3000/api/register', donneesFormulaire);
            navigate('/login');
        } catch (erreur) {
            setErreurInscription(erreur.response?.data?.message || 'Erreur lors de l\'inscription');
        }
    };

    return {
        donneesFormulaire,
        erreurInscription,
        gestionChangement,
        gestionSoumission
    };
}