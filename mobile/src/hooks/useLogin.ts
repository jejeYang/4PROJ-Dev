import { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { lienApi } from '../api/api';

export function useLogin(navigation?: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const [showGuestLinkModal, setShowGuestLinkModal] = useState(false);
    const [guestLinkInput, setGuestLinkInput] = useState('');
    const [guestPassword, setGuestPassword] = useState('');
    const [isAccessingLink, setIsAccessingLink] = useState(false);

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
            // Vider le champ mot de passe après une erreur de connexion
            setPassword('');
        } finally {
            setIsLoading(false);
        }
    };

    const openGuestLinkModal = () => {
        setShowGuestLinkModal(true);
    };

    const closeGuestLinkModal = () => {
        setShowGuestLinkModal(false);
        setGuestLinkInput('');
        setGuestPassword('');
    };

    const handleGuestLinkAccess = async () => {
        if (!guestLinkInput.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer un lien ou un code');
            return;
        }

        if (!guestPassword.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer le mot de passe');
            return;
        }

        // Extraire le token du lien complet si nécessaire
        const token = guestLinkInput.includes('/liens/') 
            ? guestLinkInput.split('/liens/').pop()?.split('?')[0]
            : guestLinkInput.trim();
        
        if (!token) {
            Alert.alert('Erreur', 'Lien invalide');
            return;
        }

        try {
            setIsAccessingLink(true);
            const linkDetails = await lienApi.getLinkDetails(token, guestPassword);
            
            // Fermer la modal et réinitialiser les champs
            closeGuestLinkModal();
            
            // Navigation vers l'écran du lien partagé
            if (navigation) {
                navigation.navigate('LinkScreen', { 
                    token, 
                    password: guestPassword,
                    linkDetails 
                });
            }
        } catch (error: any) {
            Alert.alert(
                'Erreur', 
                error.response?.data?.error || 'Impossible d\'accéder au lien. Vérifiez le lien et le mot de passe.'
            );
        } finally {
            setIsAccessingLink(false);
        }
    };

    return {
        email,
        setEmail,
        password,
        setPassword,
        isLoading,
        handleLogin,
        showGuestLinkModal,
        setShowGuestLinkModal,
        guestLinkInput,
        setGuestLinkInput,
        guestPassword,
        setGuestPassword,
        isAccessingLink,
        openGuestLinkModal,
        closeGuestLinkModal,
        handleGuestLinkAccess,
    };
}