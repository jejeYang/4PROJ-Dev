import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useMobileTheme } from '../context/MobileThemeContext';

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const { theme } = useMobileTheme();

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
            onPress={() => navigation.navigate('Documents')}
          >
            <Image source={require('../assets/espace-dossier.png')} style={styles.cardIconImage} />
            <Text style={[styles.cardTitle, { color: theme.textColor }]}>Mon Espace</Text>
            <Text style={[styles.cardDescription, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
              Voir mes fichiers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.primaryCard, { backgroundColor: theme.primaryColor }]}
            onPress={() => navigation.navigate('Upload')}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  quickActions: {
    gap: 16,
  },
  actionCard: {
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryCard: {
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  cardIconImage: {
    width: 40,
    height: 40,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
  },
});
