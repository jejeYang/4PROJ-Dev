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
import { useLogin } from '../hooks/useLogin';
import { styles } from '../styles/LoginScreen.styles';

export default function LoginScreen({ navigation }: any) {
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
      </View>
    </KeyboardAvoidingView>
  );
}