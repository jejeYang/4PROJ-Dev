import { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export function useRegister() {
    const [nom, setNom] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();

    const handleRegister = async () => {
        if (!nom || !email || !password || !confirmPassword) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs');
        return;
        }

        if (password !== confirmPassword) {
        Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
        return;
        }

        if (password.length < 6) {
        Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
        return;
        }

        setIsLoading(true);
        try {
        await register({ nom, email, mdp: password });
        } catch (error: any) {
        Alert.alert('Erreur', error.response?.data?.message || 'Inscription échouée');
        } finally {
        setIsLoading(false);
        }
    };

    return {
        nom,
        setNom,
        email,
        setEmail,
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        isLoading,
        handleRegister,
    };
}