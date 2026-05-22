import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useMobileTheme } from '../context/MobileThemeContext';
import { useRegister } from '../hooks/useRegister';
import { styles } from '../styles/RegisterScreen.styles';

export default function RegisterScreen({ navigation }: any) {
  // Récupère hooks et thème
  const {
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
  } = useRegister();
  const { theme } = useMobileTheme();

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
        <Text style={[styles.subtitle, { color: theme.textColor }]}>Inscription</Text>

        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7',
            color: theme.textColor 
          }]}
          placeholder="Nom"
          placeholderTextColor={theme.isDark ? '#8E8E93' : '#C7C7CC'}
          value={nom}
          onChangeText={setNom}
        />

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

        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7',
            color: theme.textColor 
          }]}
          placeholder="Confirmer le mot de passe"
          placeholderTextColor={theme.isDark ? '#8E8E93' : '#C7C7CC'}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primaryColor }]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Inscription...' : 'S\'inscrire'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[styles.linkText, { color: theme.primaryColor }]}>
            Déjà un compte ? Se connecter
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}