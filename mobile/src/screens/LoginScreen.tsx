import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { useMobileTheme } from '../context/MobileThemeContext';
import { useLogin } from '../hooks/useLogin';
import { lienApi } from '../api/api';
import { styles } from '../styles/LoginScreen.styles';

export default function LoginScreen({ navigation }: any) {
  // États locaux pour la modal de lien public
  const [showGuestLinkModal, setShowGuestLinkModal] = useState(false);
  const [guestLinkInput, setGuestLinkInput] = useState('');
  const [guestPassword, setGuestPassword] = useState('');
  const [isAccessingLink, setIsAccessingLink] = useState(false);
  
  // Récupère hooks et thème
  const { 
    email, 
    setEmail, 
    password, 
    setPassword, 
    isLoading, 
    handleLogin 
  } = useLogin();
  const { theme } = useMobileTheme();

  // Fonction pour gérer l'accès au lien public
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
      setShowGuestLinkModal(false);
      setGuestLinkInput('');
      setGuestPassword('');
      
      // Navigation vers l'écran du lien partagé
      navigation.navigate('LinkScreen', { 
        token, 
        password: guestPassword,
        linkDetails 
      });
    } catch (error: any) {
      Alert.alert(
        'Erreur', 
        error.response?.data?.error || 'Impossible d\'accéder au lien. Vérifiez le lien et le mot de passe.'
      );
    } finally {
      setIsAccessingLink(false);
    }
  };

  // Affichage du formulaire de connexion
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
    >
      <View style={styles.content}>
        <Image 
          source={require('../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: theme.textColor }]}>SupFile</Text>
        <Text style={[styles.subtitle, { color: theme.textColor }]}>Connexion</Text>

        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7',
            color: theme.textColor 
          }]}
          placeholder="Email"
          placeholderTextColor={theme.isDark ? '#8E8E93' : '#C7C7CC'}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7',
            color: theme.textColor 
          }]}
          placeholder="Mot de passe"
          placeholderTextColor={theme.isDark ? '#8E8E93' : '#C7C7CC'}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primaryColor }]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={[styles.linkText, { color: theme.primaryColor }]}>
            Pas encore de compte ? S'inscrire
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.linkButton, { marginTop: 10 }]}
          onPress={() => setShowGuestLinkModal(true)}
        >
          <Text style={[styles.linkText, { color: theme.primaryColor }]}>
            Vous avez un lien ? Accéder à votre lien public
          </Text>
        </TouchableOpacity>

        {/* Modal pour entrer le lien public */}
        <Modal
          visible={showGuestLinkModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowGuestLinkModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.backgroundColor }]}>
              <Text style={[styles.modalTitle, { color: theme.textColor }]}>
                Accès lien public
              </Text>
              <Text style={[styles.modalDescription, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                Collez le lien de partage
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7',
                  color: theme.textColor,
                  marginTop: 15
                }]}
                placeholder="Lien de partage"
                placeholderTextColor={theme.isDark ? '#8E8E93' : '#C7C7CC'}
                value={guestLinkInput}
                onChangeText={setGuestLinkInput}
                autoCapitalize="none"
                autoFocus
              />
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7',
                  color: theme.textColor,
                  marginTop: 15
                }]}
                placeholder="Mot de passe"
                placeholderTextColor={theme.isDark ? '#8E8E93' : '#C7C7CC'}
                value={guestPassword}
                onChangeText={setGuestPassword}
                secureTextEntry
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowGuestLinkModal(false);
                    setGuestLinkInput('');
                    setGuestPassword('');
                  }}
                  disabled={isAccessingLink}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { 
                    backgroundColor: theme.primaryColor,
                    opacity: isAccessingLink ? 0.6 : 1
                  }]}
                  onPress={handleGuestLinkAccess}
                  disabled={isAccessingLink}
                >
                  <Text style={styles.buttonText}>
                    {isAccessingLink ? 'Vérification...' : 'Accéder'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}
