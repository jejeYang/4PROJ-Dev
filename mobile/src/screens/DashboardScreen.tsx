import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useMobileTheme } from '../context/MobileThemeContext';
import { apiClient } from '../api/client';
import { getFileType, getFileTypeEmoji, getFileTypeLabel } from '../utils/fileUtils';

interface StorageStats {
  utilise: number;
  total: number;
}

interface FileTypeStats {
  type: string;
  count: number;
  emoji: string;
  label: string;
}

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const { theme } = useMobileTheme();
  
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [fileTypeStats, setFileTypeStats] = useState<FileTypeStats[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const MAX_STORAGE = 30 * 1024 * 1024 * 1024; // 30 GB

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 octets';
    const k = 1024;
    const sizes = ['octets', 'Ko', 'Mo', 'Go', 'To'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const fetchStorageStats = useCallback(async () => {
    try {
      const response = await apiClient.get<{ 
        stockage: StorageStats; 
        tousLesFichiers: string[];
      }>('/api/dossiers/stats/home');
      
      setStorageStats(response.stockage);
      
      // Calculer la répartition des types de fichiers
      const typeCounts: { [key: string]: number } = {};
      response.tousLesFichiers.forEach((fileName: string) => {
        const type = getFileType(fileName);
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      
      // Convertir en tableau et trier par nombre
      const fileTypes = Object.keys(typeCounts)
        .map(type => ({
          type,
          count: typeCounts[type],
          emoji: getFileTypeEmoji(type),
          label: getFileTypeLabel(type)
        }))
        .sort((a, b) => b.count - a.count);
      
      setFileTypeStats(fileTypes);
    } catch (error) {
      console.error('Erreur lors de la récupération des stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStorageStats();
    }, [fetchStorageStats])
  );

  const getBarColor = (index: number): string => {
    const colors = ['#06BCC1', '#474973', '#4ae61f', '#6a166f', '#f48d25', '#FF6B6B', '#4ECDC4'];
    return colors[index % colors.length];
  };

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

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF' }]}
            onPress={() => navigation.navigate('Share')}
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
    marginBottom: 20,
  },
  storageCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  storageTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  storagePercentage: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  storageBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  storageBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  storageText: {
    fontSize: 14,
  },
  distributionCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  distributionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  distributionItem: {
    marginBottom: 16,
  },
  distributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  distributionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distributionEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  distributionType: {
    fontSize: 16,
    fontWeight: '500',
  },
  distributionCount: {
    fontSize: 14,
  },
  distributionBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  distributionBarFill: {
    height: '100%',
    borderRadius: 3,
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
