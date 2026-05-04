import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dossierApi, Dossier, Fichier } from '../api/api';
import { API_BASE_URL } from '../config';
import { useMobileTheme } from '../context/MobileThemeContext';
import { useAuth } from '../context/AuthContext';

interface BreadcrumbItem {
  id: number | null;
  name: string;
}

interface DisplayItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size?: number;
  dossier?: Dossier;
  fichier?: Fichier;
}

export default function DocumentsScreen({ navigation }: any) {
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([{ id: null, name: 'Mes Documents' }]);
  const [currentDossierId, setCurrentDossierId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [userRootFolderId, setUserRootFolderId] = useState<number | null>(null);
  const [isInTrash, setIsInTrash] = useState(false);
  const [corbeilleId, setCorbeilleId] = useState<number | null>(null);
  const [trashSize, setTrashSize] = useState(0);
  const { theme } = useMobileTheme();
  const { user } = useAuth();

  useEffect(() => {
    loadContent();
  }, [currentDossierId]);

  // Recharger le contenu quand l'écran reçoit le focus (après navigation)
  useFocusEffect(
    React.useCallback(() => {
      loadContent();
    }, [currentDossierId])
  );

  const loadContent = async () => {
    try {
      setIsLoading(true);
      const userId = user?.id || user?.idCompte;
      
      if (!userId) {
        Alert.alert('Erreur', 'Utilisateur non connecté');
        return;
      }

      let dossiers: Dossier[] = [];
      let fichiers: Fichier[] = [];

      if (currentDossierId === null) {
        // Charger les dossiers racine pour trouver user_X
        const dossiersRacine = await dossierApi.getDossiersRacine(userId);
        
        // Trouver le dossier user_X
        const userFolder = dossiersRacine.find(d => d.cheminDaccesDossier === `user_${userId}`);
        
        if (userFolder) {
          // Sauvegarder l'ID du dossier racine de l'utilisateur
          setUserRootFolderId(userFolder.idDossier);
          
          // Charger directement le contenu du dossier user_X
          const [sousDossiers, fichiersDossier] = await Promise.all([
            dossierApi.getSousDossiers(userFolder.idDossier),
            dossierApi.getFichiers(userFolder.idDossier),
          ]);
          dossiers = sousDossiers;
          fichiers = fichiersDossier;
          
          // Trouver et sauvegarder l'ID de la corbeille
          const corbeille = sousDossiers.find(d => {
            const folderName = d.cheminDaccesDossier.split('/').pop() || d.cheminDaccesDossier;
            return folderName === '.corbeille';
          });
          
          if (corbeille) {
            setCorbeilleId(corbeille.idDossier);
          } else {
            // Si la corbeille n'existe pas, on peut aussi vérifier dans dossiersRacine
            const corbeilleRacine = dossiersRacine.find(d => {
              const folderName = d.cheminDaccesDossier.split('/').pop() || d.cheminDaccesDossier;
              return folderName === '.corbeille';
            });
            if (corbeilleRacine) {
              setCorbeilleId(corbeilleRacine.idDossier);
            }
          }
        } else {
          // Si pas de dossier user_X, afficher tous les dossiers racine
          dossiers = dossiersRacine;
        }
        setIsInTrash(false);
      } else {
        // Charger les sous-dossiers et fichiers du dossier actuel
        const [sousDossiers, fichiersDossier] = await Promise.all([
          dossierApi.getSousDossiers(currentDossierId),
          dossierApi.getFichiers(currentDossierId),
        ]);
        dossiers = sousDossiers;
        fichiers = fichiersDossier;
        
        // Vérifier si on est dans la corbeille
        const inTrash = currentDossierId === corbeilleId;
        setIsInTrash(inTrash);
        
        // Calculer la taille totale si on est dans la corbeille
        if (inTrash) {
          const totalSize = fichiers.reduce((sum, f) => sum + (f.taille || 0), 0);
          setTrashSize(totalSize);
        }
      }

      // Convertir en DisplayItem et filtrer la corbeille de la liste visible
      const displayItems: DisplayItem[] = [
        ...dossiers
          .filter(d => {
            const folderName = d.cheminDaccesDossier.split('/').pop() || d.cheminDaccesDossier;
            return folderName !== '.corbeille';
          })
          .map(d => {
            const folderName = d.cheminDaccesDossier.split('/').pop() || d.cheminDaccesDossier;
            return {
              id: `folder-${d.idDossier}`,
              name: folderName,
              type: 'folder' as const,
              dossier: d,
            };
          }),
        ...fichiers.map(f => ({
          id: `file-${f.nom}`,
          name: f.nom,
          type: 'file' as const,
          size: f.taille,
          fichier: f,
        })),
      ];

      setItems(displayItems);
    } catch (error: any) {
      console.error('Erreur chargement:', error);
      Alert.alert('Erreur', 'Impossible de charger les documents');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToFolder = (dossier: Dossier) => {
    const folderName = dossier.cheminDaccesDossier.split('/').pop() || dossier.cheminDaccesDossier;
    setBreadcrumb([...breadcrumb, { id: dossier.idDossier, name: folderName }]);
    setCurrentDossierId(dossier.idDossier);
  };

  const navigateToTrash = async () => {
    if (!corbeilleId) {
      // Essayer de créer la corbeille si elle n'existe pas
      try {
        const userId = user?.id || user?.idCompte;
        if (!userId || !userRootFolderId) {
          Alert.alert('Erreur', 'Impossible de créer la corbeille');
          return;
        }
        
        Alert.alert('Info', 'Création de la corbeille...');
        const nouveauDossier = await dossierApi.createDossier({
          cheminDaccesDossier: '.corbeille',
          idDossierParent: userRootFolderId,
        });
        
        setCorbeilleId(nouveauDossier.idDossier);
        setBreadcrumb([...breadcrumb, { id: nouveauDossier.idDossier, name: 'Corbeille' }]);
        setCurrentDossierId(nouveauDossier.idDossier);
      } catch (error: any) {
        console.error('Erreur création corbeille:', error);
        Alert.alert('Erreur', error.response?.data?.error || 'Impossible d\'accéder à la corbeille');
      }
      return;
    }
    setBreadcrumb([...breadcrumb, { id: corbeilleId, name: 'Corbeille' }]);
    setCurrentDossierId(corbeilleId);
  };

  const navigateToLevel = (index: number) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1);
    setBreadcrumb(newBreadcrumb);
    setCurrentDossierId(newBreadcrumb[newBreadcrumb.length - 1].id);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Erreur', 'Le nom du dossier ne peut pas être vide');
      return;
    }

    try {
      // Utiliser userRootFolderId si on est à la racine, sinon currentDossierId
      const parentId = currentDossierId || userRootFolderId;
      
      await dossierApi.createDossier({
        cheminDaccesDossier: newFolderName,
        idDossierParent: parentId || undefined,
      });
      
      Alert.alert('Succès', 'Dossier créé avec succès');
      setNewFolderName('');
      setShowCreateModal(false);
      loadContent();
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.error || 'Impossible de créer le dossier');
    }
  };

  const handleFilePress = async (item: DisplayItem) => {
    if (!item.fichier) return;

    // Utiliser userRootFolderId si on est à la racine, sinon currentDossierId
    const dossierId = currentDossierId || userRootFolderId;
    
    if (!dossierId) {
      Alert.alert('Erreur', 'Impossible de déterminer le dossier');
      return;
    }

    try {
      // Récupérer le token d'authentification
      const token = await AsyncStorage.getItem('@supfile_token');
      if (!token) {
        Alert.alert('Erreur', 'Non authentifié');
        return;
      }

      // Construire l'URL du fichier
      const fileUrl = dossierApi.getFileUrl(dossierId, item.name);
      
      // Définir le chemin local pour télécharger le fichier
      const docDir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || '';
      const fileUri = docDir + item.name;

      Alert.alert('Téléchargement', 'Téléchargement du fichier...');

      // Télécharger le fichier avec authentification
      const downloadResult = await FileSystem.downloadAsync(
        fileUrl,
        fileUri,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (downloadResult.status === 200) {
        // Vérifier si le partage est disponible
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(downloadResult.uri);
        } else {
          Alert.alert('Succès', 'Fichier téléchargé: ' + downloadResult.uri);
        }
      } else {
        Alert.alert('Erreur', 'Impossible de télécharger le fichier');
      }
    } catch (error: any) {
      console.error('Erreur téléchargement fichier:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'ouvrir le fichier');
    }
  };

  const handleMoveToTrash = (item: DisplayItem) => {
    Alert.alert(
      'Déplacer vers la corbeille',
      `Voulez-vous déplacer "${item.name}" vers la corbeille ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déplacer',
          style: 'destructive',
          onPress: async () => {
            try {
              if (item.type === 'folder' && item.dossier) {
                await dossierApi.moveToTrash(item.dossier.idDossier);
              } else if (item.type === 'file') {
                const dossierId = currentDossierId || userRootFolderId;
                if (dossierId) {
                  await dossierApi.moveFileToTrash(dossierId, item.name);
                } else {
                  throw new Error('Impossible de déterminer le dossier');
                }
              }
              Alert.alert('Succès', 'Élément déplacé vers la corbeille');
              loadContent();
            } catch (error: any) {
              Alert.alert('Erreur', error.response?.data?.error || 'Impossible de déplacer l\'élément');
            }
          },
        },
      ]
    );
  };

  const handleRestore = (item: DisplayItem) => {
    Alert.alert(
      'Restaurer',
      `Voulez-vous restaurer "${item.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Restaurer',
          onPress: async () => {
            try {
              if (item.type === 'folder' && item.dossier) {
                await dossierApi.restoreDossier(item.dossier.idDossier);
              } else if (item.type === 'file') {
                await dossierApi.restoreFichier(item.name);
              }
              Alert.alert('Succès', 'Élément restauré');
              loadContent();
            } catch (error: any) {
              Alert.alert('Erreur', error.response?.data?.error || 'Impossible de restaurer l\'élément');
            }
          },
        },
      ]
    );
  };

  const handleDeletePermanently = (item: DisplayItem) => {
    Alert.alert(
      'Supprimer définitivement',
      `Voulez-vous supprimer définitivement "${item.name}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              if (item.type === 'folder' && item.dossier) {
                await dossierApi.deleteDossier(item.dossier.idDossier);
              } else if (item.type === 'file') {
                const dossierId = currentDossierId || userRootFolderId;
                if (dossierId) {
                  await dossierApi.deleteFichier(dossierId, item.name);
                } else {
                  throw new Error('Impossible de déterminer le dossier');
                }
              }
              Alert.alert('Succès', 'Élément supprimé définitivement');
              loadContent();
            } catch (error: any) {
              Alert.alert('Erreur', error.response?.data?.error || 'Impossible de supprimer l\'élément');
            }
          },
        },
      ]
    );
  };

  const handleDownloadZip = async (item: DisplayItem) => {
    if (item.type !== 'folder' || !item.dossier) return;

    try {
      Alert.alert('Téléchargement', 'Préparation du téléchargement ZIP...');
      
      const token = await AsyncStorage.getItem('@supfile_token');
      if (!token) {
        Alert.alert('Erreur', 'Non authentifié');
        return;
      }

      // Construire l'URL pour le téléchargement ZIP
      const zipUrl = `${API_BASE_URL}/api/telechargerZip?idDossier=${item.dossier.idDossier}`;
      const docDir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || '';
      const zipUri = docDir + item.name + '.zip';

      // Télécharger le fichier ZIP avec authentification
      const downloadResult = await FileSystem.downloadAsync(
        zipUrl,
        zipUri,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (downloadResult.status === 200) {
        // Vérifier si le partage est disponible
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(downloadResult.uri);
          Alert.alert('Succès', 'Dossier téléchargé en ZIP');
        } else {
          Alert.alert('Succès', 'Fichier téléchargé: ' + downloadResult.uri);
        }
      } else {
        Alert.alert('Erreur', 'Impossible de télécharger le dossier');
      }
      
    } catch (error: any) {
      console.error('Erreur téléchargement ZIP:', error);
      Alert.alert('Erreur', error.message || 'Impossible de télécharger le dossier');
    }
  };

  const showItemOptions = (item: DisplayItem) => {
    const options: any[] = [];

    // Option Ouvrir
    if (item.type === 'folder') {
      options.push({
        text: 'Ouvrir',
        onPress: () => {
          if (item.dossier) {
            navigateToFolder(item.dossier);
          }
        },
      });
    } else {
      options.push({
        text: 'Télécharger',
        onPress: () => handleFilePress(item),
      });
    }

    // Options selon si on est dans la corbeille ou pas
    if (isInTrash) {
      // Dans la corbeille : Restaurer et Supprimer définitivement
      options.push({
        text: 'Restaurer',
        onPress: () => handleRestore(item),
      });
      options.push({
        text: 'Supprimer définitivement',
        style: 'destructive',
        onPress: () => handleDeletePermanently(item),
      });
    } else {
      // Hors corbeille : Télécharger ZIP (pour dossiers) et Déplacer vers corbeille
      if (item.type === 'folder') {
        options.push({
          text: 'Télécharger en ZIP',
          onPress: () => handleDownloadZip(item),
        });
      }
      options.push({
        text: 'Déplacer vers la corbeille',
        style: 'destructive',
        onPress: () => handleMoveToTrash(item),
      });
    }

    options.push({ text: 'Annuler', style: 'cancel' });

    Alert.alert(item.name, 'Que voulez-vous faire ?', options);
  };

  const renderBreadcrumb = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.breadcrumb, { backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7' }]}
    >
      {breadcrumb.map((crumb, index) => (
        <View key={index} style={styles.breadcrumbItem}>
          <TouchableOpacity onPress={() => navigateToLevel(index)}>
            <Text
              style={[
                styles.breadcrumbText,
                { color: index === breadcrumb.length - 1 ? theme.primaryColor : theme.textColor },
              ]}
            >
              {crumb.name}
            </Text>
          </TouchableOpacity>
          {index < breadcrumb.length - 1 && (
            <Text style={[styles.breadcrumbSeparator, { color: theme.textColor }]}> / </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );

  const renderFileItem = ({ item }: { item: DisplayItem }) => (
    <TouchableOpacity
      style={[styles.fileItem, { backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF' }]}
      onPress={() => {
        if (item.type === 'folder' && item.dossier) {
          navigateToFolder(item.dossier);
        } else {
          handleFilePress(item);
        }
      }}
      onLongPress={() => showItemOptions(item)}
    >
      <View style={styles.fileIcon}>
        <Text style={styles.iconText}>{item.type === 'folder' ? '📁' : '📄'}</Text>
      </View>
      <View style={styles.fileInfo}>
        <Text style={[styles.fileName, { color: theme.textColor }]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.size && (
          <Text style={[styles.fileSize, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
            {formatFileSize(item.size)}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={() => showItemOptions(item)} style={styles.moreButton}>
        <Text style={{ fontSize: 20, color: theme.textColor }}>⋮</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleEmptyTrash = () => {
    Alert.alert(
      'Vider la corbeille',
      'Êtes-vous sûr de vouloir vider complètement la corbeille ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vider',
          style: 'destructive',
          onPress: async () => {
            try {
              await dossierApi.emptyTrash();
              Alert.alert('Succès', 'Corbeille vidée');
              loadContent();
            } catch (error: any) {
              Alert.alert('Erreur', error.response?.data?.error || 'Impossible de vider la corbeille');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.backgroundColor }]}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Breadcrumb */}
      {renderBreadcrumb()}

      {/* Boutons d'action */}
      <View style={styles.actionBar}>
        {!isInTrash ? (
          // Boutons normaux
          <>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primaryColor }]}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.actionButtonText}>📁 Nouveau</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primaryColor }]}
              onPress={() => navigation.navigate('Upload')}
            >
              <Text style={styles.actionButtonText}>📤 Upload</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
              onPress={navigateToTrash}
            >
              <Text style={styles.actionButtonText}>🗑️ Corbeille</Text>
            </TouchableOpacity>
          </>
        ) : (
          // Boutons dans la corbeille
          <>
            <View style={[styles.trashInfoContainer, { backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7' }]}>
              <Text style={[styles.trashInfoText, { color: theme.textColor }]}>
                Taille totale : {formatFileSize(trashSize)}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FF3B30', flex: 0.6 }]}
              onPress={handleEmptyTrash}
            >
              <Text style={styles.actionButtonText}>Vider</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Liste des fichiers et dossiers */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderFileItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={[styles.emptyText, { color: theme.textColor }]}>
              Aucun document
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
              Commencez par créer un dossier ou uploader un fichier
            </Text>
          </View>
        }
        refreshing={isLoading}
        onRefresh={loadContent}
        contentContainerStyle={items.length === 0 ? styles.emptyList : undefined}
      />

      {/* Modal de création de dossier */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundColor }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>
              Nouveau Dossier
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7',
                  color: theme.textColor,
                },
              ]}
              placeholder="Nom du dossier"
              placeholderTextColor={theme.isDark ? '#8E8E93' : '#6C6C70'}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewFolderName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primaryColor }]}
                onPress={handleCreateFolder}
              >
                <Text style={styles.modalButtonText}>Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breadcrumb: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbText: {
    fontSize: 14,
    fontWeight: '500',
  },
  breadcrumbSeparator: {
    fontSize: 14,
    opacity: 0.5,
  },
  actionBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  trashInfoContainer: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  trashInfoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fileItem: {
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fileIcon: {
    marginRight: 12,
  },
  iconText: {
    fontSize: 32,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 13,
  },
  moreButton: {
    padding: 8,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#8E8E93',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
