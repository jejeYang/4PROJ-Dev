import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useMobileTheme } from '../context/MobileThemeContext';
import { useDashboard } from '../hooks/useDashboard';
import { styles } from '../styles/DashboardScreen.styles';

export default function DashboardScreen({ navigation }: any) {
  // Récupère hooks et thème
  const { 
    user, 
    navigateToDocuments, 
    navigateToUpload,
    storageStats,
    fileTypeStats,
    isLoadingStats,
    MAX_STORAGE,
    formatBytes,
    getBarColor
  } = useDashboard(navigation);
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

        {/* Section Statistiques de Stockage */}
        <View style={[styles.actionCard, { backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF' }]}>
          <Text style={[styles.cardTitle, { color: theme.textColor, marginBottom: 15 }]}>Mon Stockage</Text>
          
          {isLoadingStats ? (
            <ActivityIndicator size="small" color={theme.primaryColor} style={{ padding: 20 }} />
          ) : (
            <>
              {/* Barre de progression globale */}
              <View style={{ marginBottom: 15 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                  <Text style={{ color: theme.textColor, fontWeight: 'bold' }}>
                    {storageStats ? formatBytes(storageStats.utilise) : '0'} utilisés
                  </Text>
                  <Text style={{ color: theme.isDark ? '#8E8E93' : '#6C6C70' }}>
                    sur {formatBytes(MAX_STORAGE)}
                  </Text>
                </View>
                <View style={{ height: 10, backgroundColor: theme.isDark ? '#3A3A3C' : '#E5E5EA', borderRadius: 5, overflow: 'hidden' }}>
                  <View style={{ 
                    height: '100%', 
                    backgroundColor: theme.primaryColor, 
                    width: `${storageStats ? Math.min((storageStats.utilise / MAX_STORAGE) * 100, 100) : 0}%` 
                  }} />
                </View>
              </View>

              {/* Répartition par type de fichier */}
              {fileTypeStats.length > 0 ? (
                <View style={{ marginTop: 10 }}>
                  {fileTypeStats.map((stat, index) => (
                    <View key={stat.type} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 18, marginRight: 10 }}>{stat.emoji}</Text>
                      <Text style={{ flex: 1, color: theme.textColor }}>{stat.label}</Text>
                      <View style={{ backgroundColor: getBarColor(index), paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                        <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>{stat.count}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ color: theme.isDark ? '#8E8E93' : '#6C6C70', fontStyle: 'italic', marginTop: 10 }}>
                  Aucun fichier pour le moment.
                </Text>
              )}
            </>
          )}
        </View>

        {/* Actions Rapides */}
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