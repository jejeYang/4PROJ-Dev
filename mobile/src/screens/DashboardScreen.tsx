import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useMobileTheme } from '../context/MobileThemeContext';
import { useDashboard, obtenirEmojiFichier, formatFileSize } from '../hooks/useDashboard';
import { styles } from '../styles/DashboardScreen.styles';
import Footer from '../components/Footer';

export default function DashboardScreen({ navigation }: any) {
  // Récupère hooks et thème
  const {
    user,
    storageStats,
    fileTypeStats,
    derniersDossiers,
    derniersFichiers,
    isLoadingStats,
    MAX_STORAGE,
    navigateToDocuments,
    navigateToUpload,
    navigateToShare,
    navigateToDossier,
    formatBytes,
    getBarColor,
  } = useDashboard(navigation);
  const { theme } = useMobileTheme();

  const cardBg = theme.isDark ? '#2C2C2E' : '#FFFFFF';
  const subtleColor = theme.isDark ? '#8E8E93' : '#6C6C70';

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundColor }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.textColor }]}>
            Bienvenue, {user?.nom} !
          </Text>
          <Text style={[styles.subtitle, { color: subtleColor }]}>
            Gérez vos fichiers en toute sécurité
          </Text>

          {/* Actions rapides */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: cardBg }]}
              onPress={navigateToDocuments}
            >
              <Image source={require('../assets/espace-dossier.png')} style={styles.cardIconImage} />
              <Text style={[styles.cardTitle, { color: theme.textColor }]}>Mon Espace</Text>
              <Text style={[styles.cardDescription, { color: subtleColor }]}>Voir mes fichiers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.primaryCard, { backgroundColor: theme.primaryColor }]}
              onPress={navigateToUpload}
            >
              <Image source={require('../assets/uploader-des-fichiers.png')} style={styles.cardIconImage} />
              <Text style={[styles.cardTitle, { color: '#FFFFFF' }]}>Uploader</Text>
              <Text style={[styles.cardDescription, { color: '#FFFFFF', opacity: 0.9 }]}>Ajouter des fichiers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: cardBg }]}
              onPress={navigateToShare}
            >
              <Text style={styles.cardIcon}>🔗</Text>
              <Text style={[styles.cardTitle, { color: theme.textColor }]}>Partages</Text>
              <Text style={[styles.cardDescription, { color: subtleColor }]}>Gérer mes partages</Text>
            </TouchableOpacity>
          </View>

          {/* Stockage */}
          {isLoadingStats ? (
            <View style={[styles.storageCard, { backgroundColor: cardBg }]}>
              <ActivityIndicator size="small" color={theme.primaryColor} />
            </View>
          ) : storageStats ? (
            <View style={[styles.storageCard, { backgroundColor: cardBg }]}>
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
                      width: `${Math.min((storageStats.utilise / MAX_STORAGE) * 100, 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.storageText, { color: subtleColor }]}>
                {formatBytes(storageStats.utilise)} utilisé sur {formatBytes(MAX_STORAGE)}
              </Text>
            </View>
          ) : null}

          {/* Dossiers récents */}
          {!isLoadingStats && derniersDossiers.length > 0 && (
            <View style={[styles.recentCard, { backgroundColor: cardBg }]}>
              <View style={styles.recentHeader}>
                <Text style={[styles.recentTitle, { color: theme.textColor }]}>Dossiers récents</Text>
              </View>
              {derniersDossiers.map((dossier) => (
                <TouchableOpacity
                  key={dossier.idDossier}
                  style={[styles.recentItem, { borderBottomColor: theme.isDark ? '#3A3A3C' : '#F2F2F7' }]}
                  // Redirige à l'intérieur du dossier cliqué
                  onPress={() => navigateToDossier(dossier.idDossier)}
                >
                  <Text style={styles.recentItemEmoji}>📁</Text>
                  <View style={styles.recentItemInfo}>
                    <Text style={[styles.recentItemNom, { color: theme.textColor }]} numberOfLines={1}>
                      {dossier.nom}
                    </Text>
                    <Text style={[styles.recentItemMeta, { color: subtleColor }]}>
                      {new Date(dossier.mtime).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <Text style={[styles.recentChevron, { color: subtleColor }]}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Fichiers récents */}
          {!isLoadingStats && derniersFichiers.length > 0 && (
            <View style={[styles.recentCard, { backgroundColor: cardBg }]}>
              <View style={styles.recentHeader}>
                <Text style={[styles.recentTitle, { color: theme.textColor }]}>Fichiers récents</Text>
              </View>
              {derniersFichiers.map((fichier, index) => (
                <TouchableOpacity
                  key={`${fichier.nom}-${index}`}
                  style={[styles.recentItem, { borderBottomColor: theme.isDark ? '#3A3A3C' : '#F2F2F7' }]}
                  // Redirige vers le dossier parent du fichier cliqué
                  onPress={() => navigateToDossier(fichier.idDossierParent)}
                >
                  <Text style={styles.recentItemEmoji}>{obtenirEmojiFichier(fichier.nom)}</Text>
                  <View style={styles.recentItemInfo}>
                    <Text style={[styles.recentItemNom, { color: theme.textColor }]} numberOfLines={1}>
                      {fichier.nom}
                    </Text>
                    <Text style={[styles.recentItemMeta, { color: subtleColor }]}>
                      {formatFileSize(fichier.taille)} · {new Date(fichier.atime).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <Text style={[styles.recentChevron, { color: subtleColor }]}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Répartition des fichiers */}
          {!isLoadingStats && fileTypeStats.length > 0 && (
            <View style={[styles.distributionCard, { backgroundColor: cardBg }]}>
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
                      <Text style={[styles.distributionCount, { color: subtleColor }]}>
                        {item.count} fichier{item.count > 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View style={[styles.distributionBar, { backgroundColor: theme.isDark ? '#1C1C1E' : '#E5E5EA' }]}>
                      <View
                        style={[
                          styles.distributionBarFill,
                          { backgroundColor: getBarColor(index), width: `${percentage}%` },
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