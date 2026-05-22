import { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export function useLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs');
        return;
        }

        setIsLoading(true);
        try {
        await login({ email, mdp: password });
        } catch (error: any) {
        Alert.alert('Erreur', error.response?.data?.message || 'Connexion échouée');
        } finally {
        setIsLoading(false);
        }
    };

    return {
        email,
        setEmail,
        password,
        setPassword,
        isLoading,
        handleLogin,
    };
}