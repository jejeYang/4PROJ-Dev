import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useMobileTheme } from '../context/MobileThemeContext';
import { useShare } from '../hooks/useShare';
import { styles } from '../styles/ShareScreen.styles';

export default function ShareScreen({ navigation }: any) {
  const { theme } = useMobileTheme();
  const {
    partagesRecus,
    partagesEnvoyes,
    liensPublics,
    isLoading,
    refreshing,
    fetchAllPartages,
    onRefresh,
    supprimerLienPublic,
    resilierPartageInterne,
    allerVersDossier,
    copierLien,
  } = useShare(navigation);

  useFocusEffect(
    useCallback(() => {
      fetchAllPartages();
    }, [fetchAllPartages])
  );

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

        {/* partages reçus */}
        <View style={[styles.section, { backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF' }]}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={require('../assets/recu.png')} style={styles.sectionTitleIcon} />
              <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Partages reçus</Text>
            </View>
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
                  <Image source={require('../assets/recu.png')} style={styles.itemIconImage} />
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemTitle, { color: theme.textColor }]}>
                      {p.cheminDaccesDossier}
                    </Text>
                    <Text style={[styles.itemSubtext, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                      De : {p.emailContact || 'Utilisateur inconnu'}
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

        {/* partages envoyés */}
        <View style={[styles.section, { backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF' }]}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={require('../assets/expedie.png')} style={styles.sectionTitleIcon} />
              <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Partages envoyés</Text>
            </View>
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
                  <Image source={require('../assets/expedie.png')} style={styles.itemIconImage} />
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemTitle, { color: theme.textColor }]}>
                      {p.cheminDaccesDossier}
                    </Text>
                    <Text style={[styles.itemSubtext, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                      Vers : {p.emailContact || 'Utilisateur inconnu'}
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

        {/* liens publics */}
        <View style={[styles.section, { backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF' }]}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image source={require('../assets/lien.png')} style={styles.sectionTitleIcon} />
              <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Liens publics</Text>
            </View>
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
                  <Image 
                    source={l.type === 'dossier' ? require('../assets/dossier.png') : require('../assets/docs.png')} 
                    style={styles.itemIconImage} 
                  />
                  <View style={styles.itemInfo}>
                    <View style={styles.itemTitleRow}>
                      <Text style={[styles.itemTitle, { color: theme.textColor }]}>{l.nom}</Text>
                      <View style={[styles.badge, { backgroundColor: l.protege ? '#FF9500' : '#34C759' }]}>
                        <Text style={styles.badgeText}>{l.protege ? 'Protégé' : 'Public'}</Text>
                      </View>
                    </View>
                    <Text style={[styles.itemSubtext, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                      Expire le : {l.dateExpiration ? new Date(l.dateExpiration).toLocaleDateString() : 'Jamais'}
                    </Text>
                    <Text style={[styles.itemDate, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                      Créé le {new Date(l.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={[styles.copyHint, { color: theme.primaryColor }]}>
                      Appuyez pour copier le lien
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
