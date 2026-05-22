import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { useMobileTheme } from '../context/MobileThemeContext';
import { useLogin } from '../hooks/useLogin';
import { styles } from '../styles/LoginScreen.styles';
import Footer from '../components/Footer';

export default function LoginScreen({ navigation }: any) {
  const { theme } = useMobileTheme();
  const { 
    email, 
    setEmail, 
    password, 
    setPassword, 
    isLoading, 
    handleLogin,
    showGuestLinkModal,
    guestLinkInput,
    setGuestLinkInput,
    guestPassword,
    setGuestPassword,
    isAccessingLink,
    openGuestLinkModal,
    closeGuestLinkModal,
    handleGuestLinkAccess,
  } = useLogin(navigation);
  return (
    <View style={[{ flex: 1, backgroundColor: theme.backgroundColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
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
            onPress={openGuestLinkModal}
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
            onRequestClose={closeGuestLinkModal}
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
                    onPress={closeGuestLinkModal}
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

      <Footer />
    </View>
  );
}