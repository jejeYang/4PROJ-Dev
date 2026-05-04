import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useMobileTheme } from '../context/MobileThemeContext';
import { apiClient } from '../api/client';


export default function ProfileScreen() {
  const { user, logout, refreshUser, token } = useAuth();
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



  const handleUpdateProfile = async () => {
    try {
      await apiClient.put(`/users/${user?.id}`, {
        nom: formData.nom,
        email: formData.email,
      });

      // Mettre à jour AsyncStorage avec les nouvelles données (comme localStorage sur le web)
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
          <View style={[styles.avatar, { backgroundColor: theme.primaryColor }]}>
            <Text style={styles.avatarText}>
              {formData.nom.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.name, { color: theme.textColor }]}>Mon Profil</Text>
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
          <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
            <Text style={styles.dangerButtonText}>Supprimer mon compte</Text>
          </TouchableOpacity>
        </View>

        {/* Bouton de déconnexion */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
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
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: 'bold',
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
});
