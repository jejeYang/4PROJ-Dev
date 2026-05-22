import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useMobileTheme } from '../context/MobileThemeContext';
import { apiClient } from '../api/client';
import { API_BASE_URL } from '../config';


export default function ProfileScreen() {
  const { user, logout, refreshUser, token, updateUserData } = useAuth();
  const { theme, toggleTheme } = useMobileTheme();

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
        // Ne pas rafraîchir si l'utilisateur n'est pas connecté ou si le token est manquant
        if (!user || !token) return;
        
        try {
          await refreshUser();
        } catch (error: any) {
          // Ignorer les erreurs 401 (déconnexion en cours)
          if (error?.response?.status === 401) {
            return;
          }
          console.error('Erreur lors du rafraîchissement automatique:', error);
        }
      };
      loadProfile();
    }, [refreshUser, token])
  );

  // Mettre à jour le formulaire uniquement si on n'est pas en train d'éditer
  React.useEffect(() => {
    if (!isEditingProfile) {
      setFormData({
        nom: user?.nom || '',
        email: user?.email || '',
      });
    }
  }, [user, isEditingProfile]);

  // Charger l'avatar depuis l'URL si disponible
  React.useEffect(() => {
    if (user?.avatarUrl) {
      // Toujours mettre à jour l'avatar (même si avatarUri existe déjà)
      setAvatarUri(user.avatarUrl);
      setAvatarError(false);
    } else if (user?.id) {
      // Construire l'URL de l'avatar par défaut
      const defaultAvatarUrl = `${API_BASE_URL}/api/users/avatar/${user.id}?t=${Date.now()}`;
      setAvatarUri(defaultAvatarUrl);
    }
  }, [user?.id, user?.avatarUrl]);

  const pickImage = async () => {
    try {
      // Demander les permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à vos photos.');
        return;
      }

      // Lancer le sélecteur d'image
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

      // Créer le FormData pour l'upload
      const formData = new FormData();
      
      // Extraire le nom du fichier et le type MIME
      const filename = imageUri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      // Ajouter l'image au FormData
      formData.append('avatar', {
        uri: imageUri,
        name: filename,
        type: type,
      } as any);

      // Envoyer l'image au serveur
      await apiClient.uploadFile('/api/users/avatar', formData);

      // Mettre à jour l'URL de l'avatar avec un timestamp pour forcer le rechargement
      const newAvatarUrl = `${API_BASE_URL}/api/users/avatar/${user?.id}?t=${Date.now()}`;
      
      // Mettre à jour l'utilisateur dans le contexte
      if (user) {
        await updateUserData({
          ...user,
          avatarUrl: newAvatarUrl,
        });
      }

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
    // Validation côté client
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
      console.log('Sending update request with:', { nom: formData.nom, email: formData.email });
      
      const response = await apiClient.put<{ message: string; utilisateur: any }>(`/api/users/${user?.id}`, {
        nom: formData.nom,
        email: formData.email,
      });

      console.log('Response from backend:', response);

      // Vérifier que la réponse contient bien les données utilisateur
      if (!response || !response.utilisateur) {
        Alert.alert('Erreur', 'Réponse invalide du serveur');
        return;
      }

      // Mettre à jour l'utilisateur avec les données normalisées
      await updateUserData(response.utilisateur);
      
      Alert.alert('Succès', 'Profil mis à jour avec succès');
      setIsEditingProfile(false);
    } catch (error: any) {
      console.error('Erreur mise à jour profil:', error);
      console.error('Error details:', error.response?.data);
      const message = error.response?.data?.message || error.message || 'Erreur lors de la mise à jour';
      Alert.alert('Erreur', message);
    }
  };

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

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <View style={styles.content}>
        {/* Avatar et nom */}
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={pickImage}
            disabled={isUploadingAvatar}
          >
            {isUploadingAvatar ? (
              <View style={[styles.avatar, { backgroundColor: theme.primaryColor }]}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            ) : avatarUri && !avatarError ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarImage}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: theme.primaryColor }]}>
                <Text style={styles.avatarText}>
                  {formData.nom.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.editAvatarBadge}>
              <Text style={styles.editAvatarIcon}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={[styles.name, { color: theme.textColor }]}>Mon Profil</Text>
          <Text style={[styles.avatarHint, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
            Appuyez sur l'avatar pour changer la photo
          </Text>
        </View>

        {/* Section Thème */}
        <TouchableOpacity 
          style={[styles.themeButton, { backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF' }]}
          onPress={toggleTheme}
        >
          <View style={styles.themeContent}>
            <Text style={styles.themeIcon}>{theme.isDark ? '☀️' : '🌙'}</Text>
            <View style={styles.themeTextContainer}>
              <Text style={[styles.themeTitle, { color: theme.textColor }]}>Apparence</Text>
              <Text style={[styles.themeSubtitle, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                {theme.isDark ? 'Thème Sombre' : 'Thème Clair'}
              </Text>
            </View>
          </View>
          <Text style={[styles.chevron, { color: theme.textColor }]}>›</Text>
        </TouchableOpacity>

        {/* Section Profil */}
        <View style={[styles.section, { backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            Informations personnelles
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textColor }]}>Nom d'utilisateur</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.isDark ? '#3A3A3C' : '#F2F2F7', color: theme.textColor },
                !isEditingProfile && styles.inputDisabled,
              ]}
              value={formData.nom}
              onChangeText={(text) => setFormData({ ...formData, nom: text })}
              editable={isEditingProfile}
              placeholderTextColor={theme.isDark ? '#8E8E93' : '#6C6C70'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textColor }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.isDark ? '#3A3A3C' : '#F2F2F7', color: theme.textColor },
                !isEditingProfile && styles.inputDisabled,
              ]}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              editable={isEditingProfile}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={theme.isDark ? '#8E8E93' : '#6C6C70'}
            />
          </View>

          {isEditingProfile ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setIsEditingProfile(false);
                  setFormData({
                    nom: user?.nom || '',
                    email: user?.email || '',
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primaryColor }]}
                onPress={handleUpdateProfile}
              >
                <Text style={styles.buttonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primaryColor }]}
              onPress={() => setIsEditingProfile(true)}
            >
              <Text style={styles.buttonText}>Mettre à jour le profil</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Section Mot de passe */}
        <View style={[styles.section, { backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            Changer le mot de passe
          </Text>

          {!isChangingPassword ? (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primaryColor }]}
              onPress={() => setIsChangingPassword(true)}
            >
              <Text style={styles.buttonText}>Modifier mon mot de passe</Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textColor }]}>Ancien mot de passe</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.isDark ? '#3A3A3C' : '#F2F2F7', color: theme.textColor },
                  ]}
                  value={passwordData.ancien}
                  onChangeText={(text) => setPasswordData({ ...passwordData, ancien: text })}
                  secureTextEntry
                  placeholderTextColor={theme.isDark ? '#8E8E93' : '#6C6C70'}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textColor }]}>Nouveau mot de passe</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.isDark ? '#3A3A3C' : '#F2F2F7', color: theme.textColor },
                  ]}
                  value={passwordData.nouveau}
                  onChangeText={(text) => setPasswordData({ ...passwordData, nouveau: text })}
                  secureTextEntry
                  placeholderTextColor={theme.isDark ? '#8E8E93' : '#6C6C70'}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textColor }]}>Confirmer le mot de passe</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: theme.isDark ? '#3A3A3C' : '#F2F2F7', color: theme.textColor },
                  ]}
                  value={passwordData.confirmation}
                  onChangeText={(text) => setPasswordData({ ...passwordData, confirmation: text })}
                  secureTextEntry
                  placeholderTextColor={theme.isDark ? '#8E8E93' : '#6C6C70'}
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setIsChangingPassword(false);
                    setPasswordData({ ancien: '', nouveau: '', confirmation: '' });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: theme.primaryColor }]}
                  onPress={handleChangePassword}
                >
                  <Text style={styles.buttonText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Zone de danger */}
        <View style={[styles.section, styles.dangerSection]}>
          <Text style={[styles.sectionTitle, { color: '#ff3b30' }]}>Zone de danger</Text>
          <Text style={[styles.dangerText, { color: theme.textColor }]}>
            La suppression de votre compte est définitive. Toutes vos données seront effacées.
          </Text>
          <TouchableOpacity 
            style={styles.dangerButton} 
            onPress={() => setShowDeleteModal(true)}
          >
            <Text style={styles.dangerButtonText}>Supprimer mon compte</Text>
          </TouchableOpacity>
        </View>

        {/* Bouton de déconnexion */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* Modale de confirmation de suppression */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundColor }]}>
            <Text style={[styles.modalTitle, { color: '#ff3b30' }]}>⚠️ Action Irréversible</Text>
            <Text style={[styles.modalText, { color: theme.textColor }]}>
              Attention : Toutes vos données seront définitivement effacées. 
              Veuillez saisir votre mot de passe pour confirmer.
            </Text>
            
            <TextInput
              style={[
                styles.input,
                styles.modalInput,
                { backgroundColor: theme.isDark ? '#3A3A3C' : '#F2F2F7', color: theme.textColor }
              ]}
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="Mot de passe de confirmation"
              placeholderTextColor={theme.isDark ? '#8E8E93' : '#6C6C70'}
              secureTextEntry
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.dangerButton]}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.buttonText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  editAvatarIcon: {
    fontSize: 16,
  },
  avatarHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  themeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  themeTextContainer: {
    flex: 1,
  },
  themeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  themeSubtitle: {
    fontSize: 14,
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    flex: 1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: '#8E8E93',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerSection: {
    borderWidth: 2,
    borderColor: '#ff3b30',
    borderStyle: 'dashed',
  },
  dangerText: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.8,
  },
  dangerButton: {
    height: 48,
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    height: 48,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
});
