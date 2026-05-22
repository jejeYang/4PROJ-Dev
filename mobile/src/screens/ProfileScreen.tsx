import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useMobileTheme } from '../context/MobileThemeContext';
import { useProfile } from '../hooks/useProfile';
import { styles } from '../styles/ProfileScreen.styles';

export default function ProfileScreen() {
  const { theme, toggleTheme } = useMobileTheme();
  
  // Récupère hooks et thème
  const {
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
  } = useProfile();

  // Affichage du formulaire de connexion
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <View style={styles.content}>
        {/* Avatar et nom */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: theme.primaryColor }]}>
            <Text style={styles.avatarText}>
              {formData.nom ? formData.nom.charAt(0).toUpperCase() : '?'}
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