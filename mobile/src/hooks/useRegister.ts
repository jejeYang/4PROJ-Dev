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

    const validatePassword = (pwd: string): { isValid: boolean; message?: string } => {
        if (pwd.length < 6) {
            return { isValid: false, message: 'Le mot de passe doit contenir au moins 6 caractères' };
        }
        
        if (!/[A-Z]/.test(pwd)) {
            return { isValid: false, message: 'Le mot de passe doit contenir au moins une majuscule' };
        }
        
        if (!/[a-z]/.test(pwd)) {
            return { isValid: false, message: 'Le mot de passe doit contenir au moins une minuscule' };
        }
        
        if (!/[0-9]/.test(pwd)) {
            return { isValid: false, message: 'Le mot de passe doit contenir au moins un chiffre' };
        }
        
        if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/';~]/.test(pwd)) {
            return { isValid: false, message: 'Le mot de passe doit contenir au moins un caractère spécial' };
        }
        
        return { isValid: true };
    };

    const handleRegister = async () => {
        if (!nom || !email || !password || !confirmPassword) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs');
        return;
        }

        if (password !== confirmPassword) {
        Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
        return;
        }

        const validation = validatePassword(password);
        if (!validation.isValid) {
        Alert.alert('Erreur', validation.message || 'Mot de passe invalide');
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