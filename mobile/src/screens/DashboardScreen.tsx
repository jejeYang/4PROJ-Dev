import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useMobileTheme } from '../context/MobileThemeContext';
import { useDashboard } from '../hooks/useDashboard';
import { styles } from '../styles/DashboardScreen.styles';

export default function DashboardScreen({ navigation }: any) {
  // Récupère hooks et thème
  const { user, navigateToDocuments, navigateToUpload } = useDashboard(navigation);
  const { theme } = useMobileTheme();

  // Affichage du tableau de bord
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.textColor }]}>
          Bienvenue, {user?.nom} !
        </Text>
        <Text style={[styles.subtitle, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
          Gérez vos fichiers en toute sécurité
        </Text>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF' }]}
            onPress={navigateToDocuments}
          >
            <Image source={require('../assets/espace-dossier.png')} style={styles.cardIconImage} />
            <Text style={[styles.cardTitle, { color: theme.textColor }]}>Mon Espace</Text>
            <Text style={[styles.cardDescription, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
              Voir mes fichiers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.primaryCard, { backgroundColor: theme.primaryColor }]}
            onPress={navigateToUpload}
          >
            <Image source={require('../assets/uploader-des-fichiers.png')} style={[styles.cardIconImage]} />
            <Text style={[styles.cardTitle, { color: '#FFFFFF' }]}>Uploader</Text>
            <Text style={[styles.cardDescription, { color: '#FFFFFF', opacity: 0.9 }]}>
              Ajouter des fichiers
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}