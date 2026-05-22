import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useMobileTheme } from '../context/MobileThemeContext';
import { useDashboard } from '../hooks/useDashboard';
import { styles } from '../styles/DashboardScreen.styles';
import Footer from '../components/Footer';

export default function DashboardScreen({ navigation }: any) {
  // Récupère hooks et thème
  const { 
    user, 
    storageStats, 
    fileTypeStats, 
    isLoadingStats, 
    MAX_STORAGE, 
    navigateToDocuments, 
    navigateToUpload, 
    navigateToShare, 
    formatBytes, 
    getBarColor 
  } = useDashboard(navigation);
  const { theme } = useMobileTheme();

  // Affichage du tableau de bord
  return (
    <View style={[{ flex: 1, backgroundColor: theme.backgroundColor }]}>
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

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF' }]}
            onPress={navigateToShare}
          >
            <Text style={styles.cardIcon}>🔗</Text>
            <Text style={[styles.cardTitle, { color: theme.textColor }]}>Partages</Text>
            <Text style={[styles.cardDescription, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
              Gérer mes partages
            </Text>
          </TouchableOpacity>
        </View>

        {/* stockage */}
        {isLoadingStats ? (
          <View style={[styles.storageCard, { backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF' }]}>
            <ActivityIndicator size="small" color={theme.primaryColor} />
          </View>
        ) : storageStats ? (
          <View style={[styles.storageCard, { backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF' }]}>
            <View style={styles.storageHeader}>
              <Text style={[styles.storageTitle, { color: theme.textColor }]}>💾 Stockage</Text>
              <Text style={[styles.storagePercentage, { color: theme.primaryColor }]}>
                {Math.round((storageStats.utilise / MAX_STORAGE) * 100)}%
              </Text>
            </View>
            <View style={[styles.storageBar, { backgroundColor: theme.isDark ? '#1C1C1E' : '#E5E5EA' }]}>
              <View 
                style={[
                  styles.storageBarFill, 
                  { 
                    backgroundColor: theme.primaryColor,
                    width: `${Math.min((storageStats.utilise / MAX_STORAGE) * 100, 100)}%`
                  }
                ]} 
              />
            </View>
            <Text style={[styles.storageText, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
              {formatBytes(storageStats.utilise)} utilisé sur {formatBytes(MAX_STORAGE)}
            </Text>
          </View>
        ) : null}

        {/* répartition des fichiers */}
        {!isLoadingStats && fileTypeStats.length > 0 && (
          <View style={[styles.distributionCard, { backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF' }]}>
            <Text style={[styles.distributionTitle, { color: theme.textColor }]}>📊 Répartition des fichiers</Text>
            {fileTypeStats.map((item, index) => {
              const totalFiles = fileTypeStats.reduce((sum, t) => sum + t.count, 0);
              const percentage = (item.count / totalFiles) * 100;
              
              return (
                <View key={item.type} style={styles.distributionItem}>
                  <View style={styles.distributionHeader}>
                    <View style={styles.distributionLabel}>
                      <Text style={styles.distributionEmoji}>{item.emoji}</Text>
                      <Text style={[styles.distributionType, { color: theme.textColor }]}>{item.label}</Text>
                    </View>
                    <Text style={[styles.distributionCount, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                      {item.count} fichier{item.count > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={[styles.distributionBar, { backgroundColor: theme.isDark ? '#1C1C1E' : '#E5E5EA' }]}>
                    <View 
                      style={[
                        styles.distributionBarFill, 
                        { 
                          backgroundColor: getBarColor(index),
                          width: `${percentage}%`
                        }
                      ]} 
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
    <Footer />
    </View>
  );
}