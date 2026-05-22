import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

export function useProfile() {
    const { user, logout, refreshUser, token } = useAuth();

    // États pour la modification du profil
    const [formData, setFormData] = useState({
        nom: user?.nom || '',
        email: user?.email || '',
    });

    // États pour le changement de mot de passe
    const [passwordData, setPasswordData] = useState({
        ancien: '',
        nouveau: '',
        confirmation: '',
    });

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Rafraîchir automatiquement le profil quand on revient sur cet écran
    useFocusEffect(
        useCallback(() => {
        const loadProfile = async () => {
            // Ne pas rafraîchir si l'utilisateur n'est pas connecté ou si le token est manquant
            if (!user || !token) return;
            
            try {
            await refreshUser();
            setFormData({
                nom: user?.nom || '',
                email: user?.email || '',
            });
            } catch (error: any) {
            // Ignorer les erreurs 401 (déconnexion en cours)
            if (error?.response?.status === 401) {
                return;
            }
            console.error('Erreur lors du rafraîchissement automatique:', error);
            }
        };
        loadProfile();
        }, [refreshUser, user, token])
    );

    // Mise à jour du profil
    const handleUpdateProfile = async () => {
        try {
        await apiClient.put(`/users/${user?.id}`, {
            nom: formData.nom,
            email: formData.email,
        });

        // Mettre à jour AsyncStorage avec les nouvelles données
        const updatedUser = {
            ...user,
            nom: formData.nom,
            email: formData.email,
        };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        await refreshUser();
        
        Alert.alert('Succès', 'Profil mis à jour avec succès');
        setIsEditingProfile(false);
        } catch (error: any) {
        Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de la mise à jour');
        }
    };

    // Changement de mot de passe
    const handleChangePassword = async () => {
        if (passwordData.nouveau !== passwordData.confirmation) {
        Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
        return;
        }

        if (passwordData.nouveau.length < 6) {
        Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
        return;
        }

        try {
        await apiClient.post('/change-password', {
            ancienMdp: passwordData.ancien,
            nouveauMdp: passwordData.nouveau,
            confirmationMdp: passwordData.confirmation,
        });

        Alert.alert('Succès', 'Mot de passe modifié avec succès');
        setPasswordData({ ancien: '', nouveau: '', confirmation: '' });
        setIsChangingPassword(false);
        } catch (error: any) {
        Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors du changement de mot de passe');
        }
    };

    // Suppression du compte
    const handleDeleteAccount = () => {
        Alert.alert(
        'Supprimer le compte',
        'Cette action est irréversible. Toutes vos données seront supprimées définitivement.',
        [
            { text: 'Annuler', style: 'cancel' },
            {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
                try {
                await apiClient.delete('/users');
                await logout();
                } catch (error) {
                Alert.alert('Erreur', 'Impossible de supprimer le compte');
                }
            },
            },
        ]
        );
    };

    // Déconnexion
    const handleLogout = () => {
        Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
        { text: 'Annuler', style: 'cancel' },
        {
            text: 'Déconnexion',
            style: 'destructive',
            onPress: async () => await logout(),
        },
        ]);
    };

    return {
        user,
        formData,
        setFormData,
        passwordData,
        setPasswordData,
        isEditingProfile,
        setIsEditingProfile,
        isChangingPassword,
        setIsChangingPassword,
        handleUpdateProfile,
        handleChangePassword,
        handleDeleteAccount,
        handleLogout,
    };
}