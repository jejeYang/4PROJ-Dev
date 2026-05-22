import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useMobileTheme } from '../context/MobileThemeContext';
import { apiClient } from '../api/client';
import { API_BASE_URL } from '../config';

interface PartageRecu {
  idDossier: number;
  cheminDaccesDossier: string;
  emailContact: string;
  dateCreation: string;
}

interface PartageEnvoye {
  idDossier: number;
  cheminDaccesDossier: string;
  emailContact: string;
  dateCreation: string;
}

interface LienPublic {
  idLien: number;
  nom: string;
  type: string;
  url: string;
  protege: boolean;
  dateExpiration: string | null;
  createdAt: string;
}

export default function ShareScreen({ navigation }: any) {
  const { user } = useAuth();
  const { theme } = useMobileTheme();

  const [partagesRecus, setPartagesRecus] = useState<PartageRecu[]>([]);
  const [partagesEnvoyes, setPartagesEnvoyes] = useState<PartageEnvoye[]>([]);
  const [liensPublics, setLiensPublics] = useState<LienPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllPartages = useCallback(async () => {
    try {
      const [resRecus, resEnvoyes, resLiens] = await Promise.all([
        apiClient.get<PartageRecu[]>('/api/partage/recus'),
        apiClient.get<PartageEnvoye[]>('/api/partage/envoyes'),
        apiClient.get<LienPublic[]>('/api/partage/mes-liens'),
      ]);

      setPartagesRecus(resRecus);
      setPartagesEnvoyes(resEnvoyes);
      setLiensPublics(resLiens);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des partages:', error);
      Alert.alert('Erreur', 'Impossible de charger les partages');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAllPartages();
    }, [fetchAllPartages])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllPartages();
  };

  const supprimerLienPublic = async (idLien: number) => {
    Alert.alert(
      'Supprimer le lien',
      'Êtes-vous sûr de vouloir supprimer ce lien de partage ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/partage/lien/${idLien}`);
              setLiensPublics(prev => prev.filter(l => l.idLien !== idLien));
              Alert.alert('Succès', 'Lien supprimé avec succès');
            } catch (error: any) {
              Alert.alert('Erreur', 'Impossible de supprimer le lien');
            }
          },
        },
      ]
    );
  };

  const resilierPartageInterne = async (idDossier: number, type: 'recu' | 'envoye') => {
    const message = type === 'envoye' 
      ? 'Cela supprimera l\'accès pour tous les participants. Confirmer ?'
      : 'Voulez-vous quitter ce partage ?';
    
    Alert.alert(
      type === 'envoye' ? 'Révoquer le partage' : 'Quitter le partage',
      message,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: type === 'envoye' ? 'Révoquer' : 'Quitter',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/partage/interne/${idDossier}`);
              fetchAllPartages();
              Alert.alert('Succès', 'Partage révoqué avec succès');
            } catch (error: any) {
              Alert.alert('Erreur', 'Impossible de révoquer le partage');
            }
          },
        },
      ]
    );
  };

  const allerVersDossier = (idDossier: number) => {
    navigation.navigate('Documents', { folderId: idDossier });
  };

  const copierLien = async (url: string) => {
    try {
      const fullUrl = `${API_BASE_URL}${url}`;
      await Clipboard.setStringAsync(fullUrl);
      Alert.alert('Succès', 'Lien copié dans le presse-papier !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de copier le lien');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundColor }]}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primaryColor} />
      }
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.textColor }]}>Gestion des partages</Text>
        <Text style={[styles.subtitle, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
          Gérez vos accès, vos envois et vos liens publics.
        </Text>

        {/* PARTAGES REÇUS */}
        <View style={[styles.section, { backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF' }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textColor }]}>📥 Partages reçus</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
              Dossiers partagés par d'autres utilisateurs
            </Text>
          </View>
          {partagesRecus.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
              Aucun dossier reçu
            </Text>
          ) : (
            partagesRecus.map(p => (
              <TouchableOpacity
                key={p.idDossier}
                style={[styles.item, { backgroundColor: theme.isDark ? '#3A3A3C' : '#F2F2F7' }]}
                onPress={() => allerVersDossier(p.idDossier)}
              >
                <View style={styles.itemMain}>
                  <Text style={styles.itemIcon}>📥</Text>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemTitle, { color: theme.textColor }]}>
                      {p.cheminDaccesDossier}
                    </Text>
                    <Text style={[styles.itemSubtext, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                      De : {p.emailContact || 'Utilisateur inconnu'}
                    </Text>
                    <Text style={[styles.itemDate, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                      Reçu le {new Date(p.dateCreation).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.dangerButton}
                  onPress={(e) => {
                    resilierPartageInterne(p.idDossier, 'recu');
                  }}
                >
                  <Text style={styles.dangerButtonText}>Quitter</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* PARTAGES ENVOYÉS */}
        <View style={[styles.section, { backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF' }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textColor }]}>📤 Partages envoyés</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
              Dossiers que vous avez partagés
            </Text>
          </View>
          {partagesEnvoyes.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
              Aucun partage envoyé
            </Text>
          ) : (
            partagesEnvoyes.map(p => (
              <TouchableOpacity
                key={p.idDossier}
                style={[styles.item, { backgroundColor: theme.isDark ? '#3A3A3C' : '#F2F2F7' }]}
                onPress={() => allerVersDossier(p.idDossier)}
              >
                <View style={styles.itemMain}>
                  <Text style={styles.itemIcon}>📤</Text>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemTitle, { color: theme.textColor }]}>
                      {p.cheminDaccesDossier}
                    </Text>
                    <Text style={[styles.itemSubtext, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                      Vers : {p.emailContact || 'Utilisateur inconnu'}
                    </Text>
                    <Text style={[styles.itemDate, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                      Envoyé le {new Date(p.dateCreation).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.dangerButton}
                  onPress={() => resilierPartageInterne(p.idDossier, 'envoye')}
                >
                  <Text style={styles.dangerButtonText}>Révoquer</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* LIENS PUBLICS */}
        <View style={[styles.section, { backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF' }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textColor }]}>🔗 Liens publics</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
              Liens de partage pour invités
            </Text>
          </View>
          {liensPublics.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
              Aucun lien généré
            </Text>
          ) : (
            liensPublics.map(l => (
              <View
                key={l.idLien}
                style={[styles.item, { backgroundColor: theme.isDark ? '#3A3A3C' : '#F2F2F7' }]}
              >
                <TouchableOpacity
                  style={styles.itemMain}
                  onPress={() => copierLien(l.url)}
                >
                  <Text style={styles.itemIcon}>{l.type === 'dossier' ? '📁' : '📄'}</Text>
                  <View style={styles.itemInfo}>
                    <View style={styles.itemTitleRow}>
                      <Text style={[styles.itemTitle, { color: theme.textColor }]}>{l.nom}</Text>
                      <View style={[styles.badge, { backgroundColor: l.protege ? '#FF9500' : '#34C759' }]}>
                        <Text style={styles.badgeText}>{l.protege ? '🔒 Protégé' : '🔓 Public'}</Text>
                      </View>
                    </View>
                    <Text style={[styles.itemSubtext, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                      Expire le : {l.dateExpiration ? new Date(l.dateExpiration).toLocaleDateString() : 'Jamais'}
                    </Text>
                    <Text style={[styles.itemDate, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                      Créé le {new Date(l.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={[styles.copyHint, { color: theme.primaryColor }]}>
                      👆 Appuyez pour copier le lien
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dangerButton}
                  onPress={() => supprimerLienPublic(l.idLien)}
                >
                  <Text style={styles.dangerButtonText}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  item: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemSubtext: {
    fontSize: 14,
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 12,
  },
  copyHint: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
