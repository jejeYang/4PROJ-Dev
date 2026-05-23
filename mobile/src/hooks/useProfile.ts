import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { API_BASE_URL } from '../config';

export function useProfile() {
    const { user, logout, refreshUser, token, updateUserData } = useAuth();

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

    // États pour l'avatar
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [avatarError, setAvatarError] = useState(false);

    // États pour la modale de suppression de compte
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');

    // Rafraîchir automatiquement le profil quand on revient sur cet écran
    useFocusEffect(
        useCallback(() => {
        const loadProfile = async () => {
            if (!user || !token) return;
            try {
            await refreshUser();
            } catch (error: any) {
            if (error?.response?.status === 401) return;
            console.error('Erreur lors du rafraîchissement automatique:', error);
            }
        };
        loadProfile();
        }, [refreshUser, token, user])
    );

    // Mettre à jour le formulaire uniquement si on n'est pas en train d'éditer
    useEffect(() => {
        if (!isEditingProfile) {
        setFormData({
            nom: user?.nom || '',
            email: user?.email || '',
        });
        }
    }, [user, isEditingProfile]);

    // Charger l'avatar depuis l'URL si disponible
    useEffect(() => {
        if (user?.avatarUrl) {
            setAvatarUri(user.avatarUrl);
            setAvatarError(false);
        } else if (user?.id) {
            const defaultAvatarUrl = `${API_BASE_URL}/api/users/avatar/${user.id}?t=${Date.now()}`;
            setAvatarUri(defaultAvatarUrl);
        }
    }, [user?.id]);

    const pickImage = async () => {
        try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
            Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à vos photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            await uploadAvatar(result.assets[0].uri);
        }
        } catch (error) {
        console.error('Erreur lors de la sélection de l\'image:', error);
        Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
        }
    };

    const uploadAvatar = async (imageUri: string) => {
        try {
        setIsUploadingAvatar(true);

        const formDataToUpload = new FormData();
        const filename = imageUri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formDataToUpload.append('avatar', {
            uri: imageUri,
            name: filename,
            type: type,
        } as any);

        await apiClient.uploadFile('/api/users/avatar', formDataToUpload);

        // Rafraîchir les données utilisateur depuis le serveur
        await refreshUser();
        
        // Mettre à jour l'état local avec timestamp pour forcer le rechargement de l'image
        const newAvatarUrl = `${API_BASE_URL}/api/users/avatar/${user?.id}?t=${Date.now()}`;
        setAvatarUri(newAvatarUrl);
        setAvatarError(false);
        Alert.alert('Succès', 'Photo de profil mise à jour avec succès');
        } catch (error: any) {
        console.error('Erreur lors de l\'upload de l\'avatar:', error);
        Alert.alert('Erreur', error.response?.data?.message || 'Impossible de mettre à jour la photo de profil');
        } finally {
        setIsUploadingAvatar(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!formData.nom || formData.nom.trim().length === 0) {
        Alert.alert('Erreur', 'Le nom ne peut pas être vide');
        return;
        }
        
        if (!formData.email || formData.email.trim().length === 0) {
        Alert.alert('Erreur', "L'email ne peut pas être vide");
        return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
        Alert.alert('Erreur', "L'email n'est pas valide");
        return;
        }

        try {
        const response = await apiClient.put<{ message: string; utilisateur: any }>(`/api/users/${user?.id}`, {
            nom: formData.nom,
            email: formData.email,
        });

        if (!response || !response.utilisateur) {
            Alert.alert('Erreur', 'Réponse invalide du serveur');
            return;
        }

        await updateUserData(response.utilisateur);
        Alert.alert('Succès', 'Profil mis à jour avec succès');
        setIsEditingProfile(false);
        } catch (error: any) {
        const message = error.response?.data?.message || error.message || 'Erreur lors de la mise à jour';
        Alert.alert('Erreur', message);
        }
    };

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

    const handleChangePassword = async () => {
        if (passwordData.nouveau !== passwordData.confirmation) {
        Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
        return;
        }

        const validation = validatePassword(passwordData.nouveau);
        if (!validation.isValid) {
        Alert.alert('Erreur', validation.message || 'Mot de passe invalide');
        return;
        }

        try {
        await apiClient.post('/api/change-password', {
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

    const handleDeleteAccount = async () => {
        if (!deletePassword || deletePassword.trim().length === 0) {
        Alert.alert('Erreur', 'Veuillez entrer votre mot de passe');
        return;
        }

        try {
        await apiClient.delete('/api/users', {
            data: { mot_de_passe: deletePassword }
        });
        
        Alert.alert('Succès', 'Compte supprimé avec succès', [
            {
            text: 'OK',
            onPress: async () => {
                setShowDeleteModal(false);
                setDeletePassword('');
                await logout();
            }
            }
        ]);
        } catch (error: any) {
        Alert.alert(
            'Erreur',
            error.response?.data?.message || 'Mot de passe incorrect ou erreur lors de la suppression'
        );
        }
    };

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
        formData, setFormData,
        passwordData, setPasswordData,
        isEditingProfile, setIsEditingProfile,
        isChangingPassword, setIsChangingPassword,
        avatarUri, setAvatarUri,
        isUploadingAvatar,
        avatarError, setAvatarError,
        showDeleteModal, setShowDeleteModal,
        deletePassword, setDeletePassword,
        pickImage,
        handleUpdateProfile,
        handleChangePassword,
        handleDeleteAccount,
        handleLogout,
    };
}