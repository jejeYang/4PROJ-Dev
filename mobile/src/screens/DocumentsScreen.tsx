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
  Image,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dossierApi, lienApi, Dossier, Fichier } from '../api/api';
import { API_BASE_URL } from '../config';
import { useMobileTheme } from '../context/MobileThemeContext';
import { useAuth } from '../context/AuthContext';
import * as Clipboard from 'expo-clipboard';
import FileViewer from '../components/FileViewer';

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
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([{ id: null, name: '' }]);
  const [currentDossierId, setCurrentDossierId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [userRootFolderId, setUserRootFolderId] = useState<number | null>(null);
  const [isInTrash, setIsInTrash] = useState(false);
  const [corbeilleId, setCorbeilleId] = useState<number | null>(null);
  const [trashSize, setTrashSize] = useState(0);
  
  // États pour le déplacement
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [itemToMove, setItemToMove] = useState<DisplayItem | null>(null);
  const [moveDestination, setMoveDestination] = useState<number | null>(null);
  const [moveBreadcrumb, setMoveBreadcrumb] = useState<BreadcrumbItem[]>([{ id: null, name: 'Mes Documents' }]);
  const [moveAvailableFolders, setMoveAvailableFolders] = useState<Dossier[]>([]);
  
  // États pour les liens de partage
  const [showShareModal, setShowShareModal] = useState(false);
  const [itemToShare, setItemToShare] = useState<DisplayItem | null>(null);
  const [shareMode, setShareMode] = useState<'utilisateur' | 'invité'>('utilisateur');
  const [shareEmail, setShareEmail] = useState('');
  const [sharePassword, setSharePassword] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Par défaut: dans 7 jours
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [shareLink, setShareLink] = useState('');
  
  // État pour le menu d'options
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DisplayItem | null>(null);
  
  // États pour le visualiseur de fichiers
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [fileToView, setFileToView] = useState<{ url: string; name: string } | null>(null);
  
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
          name: decodeURIComponent(f.nom),
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

    // Ouvrir le visualiseur de fichiers
    const fileUrl = dossierApi.getFileUrl(dossierId, item.fichier.nom);
    setFileToView({ url: fileUrl, name: item.name });
    setShowFileViewer(true);
  };

  const handleDownloadFile = async (item: DisplayItem) => {
    if (!item.fichier) return;

    const dossierId = currentDossierId || userRootFolderId;
    
    if (!dossierId) {
      Alert.alert('Erreur', 'Impossible de déterminer le dossier');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('@supfile_token');
      if (!token) {
        Alert.alert('Erreur', 'Non authentifié');
        return;
      }

      const fileUrl = dossierApi.getFileUrl(dossierId, item.fichier.nom);
      const docDir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || '';
      const fileUri = docDir + item.name;

      Alert.alert('Téléchargement', 'Téléchargement du fichier...');

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
      Alert.alert('Erreur', error.message || 'Impossible de télécharger le fichier');
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
              } else if (item.type === 'file' && item.fichier) {
                const dossierId = currentDossierId || userRootFolderId;
                if (dossierId) {
                  await dossierApi.moveFileToTrash(dossierId, item.fichier.nom);
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
              } else if (item.type === 'file' && item.fichier) {
                await dossierApi.restoreFichier(item.fichier.nom);
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
              } else if (item.type === 'file' && item.fichier) {
                const dossierId = currentDossierId || userRootFolderId;
                if (dossierId) {
                  await dossierApi.deleteFichier(dossierId, item.fichier.nom);
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

  const openMoveModal = async (item: DisplayItem) => {
    setItemToMove(item);
    setMoveDestination(userRootFolderId);
    setMoveBreadcrumb([{ id: null, name: 'Mes Documents' }]);
    
    try {
      if (userRootFolderId) {
        const folders = await dossierApi.getSousDossiers(userRootFolderId);
        // Filtrer pour ne pas afficher le dossier à déplacer lui-même et la corbeille
        const availableFolders = folders.filter(f => {
          const folderName = f.cheminDaccesDossier.split('/').pop() || f.cheminDaccesDossier;
          return folderName !== '.corbeille' && 
                 (item.type !== 'folder' || f.idDossier !== item.dossier?.idDossier);
        });
        setMoveAvailableFolders(availableFolders);
      }
      setShowMoveModal(true);
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de charger les dossiers');
    }
  };

  const navigateInMoveModal = async (folderId: number | null, folderName: string) => {
    setMoveDestination(folderId || userRootFolderId);
    
    if (folderId) {
      // Naviguer vers un sous-dossier
      const newBreadcrumb = [...moveBreadcrumb, { id: folderId, name: folderName }];
      setMoveBreadcrumb(newBreadcrumb);
      
      try {
        const folders = await dossierApi.getSousDossiers(folderId);
        const availableFolders = folders.filter(f => {
          const fname = f.cheminDaccesDossier.split('/').pop() || f.cheminDaccesDossier;
          return fname !== '.corbeille' && 
                 (itemToMove?.type !== 'folder' || f.idDossier !== itemToMove.dossier?.idDossier);
        });
        setMoveAvailableFolders(availableFolders);
      } catch (error: any) {
        Alert.alert('Erreur', 'Impossible de charger les dossiers');
      }
    } else {
      // Retour à la racine
      setMoveBreadcrumb([{ id: null, name: 'Mes Documents' }]);
      if (userRootFolderId) {
        const folders = await dossierApi.getSousDossiers(userRootFolderId);
        const availableFolders = folders.filter(f => {
          const fname = f.cheminDaccesDossier.split('/').pop() || f.cheminDaccesDossier;
          return fname !== '.corbeille' && 
                 (itemToMove?.type !== 'folder' || f.idDossier !== itemToMove.dossier?.idDossier);
        });
        setMoveAvailableFolders(availableFolders);
      }
    }
  };

  const confirmMove = async () => {
    if (!itemToMove || moveDestination === null) return;
    
    try {
      if (itemToMove.type === 'folder' && itemToMove.dossier) {
        await dossierApi.moveDossier(itemToMove.dossier.idDossier, moveDestination);
        Alert.alert('Succès', 'Dossier déplacé avec succès');
      } else if (itemToMove.type === 'file' && itemToMove.fichier) {
        const sourceFolder = currentDossierId || userRootFolderId;
        if (sourceFolder) {
          await dossierApi.moveFichier(sourceFolder, itemToMove.fichier.nom, moveDestination);
          Alert.alert('Succès', 'Fichier déplacé avec succès');
        }
      }
      
      setShowMoveModal(false);
      setItemToMove(null);
      loadContent();
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.error || 'Impossible de déplacer l\'élément');
    }
  };
  
  const openShareModal = (item: DisplayItem) => {
    setItemToShare(item);
    
    // Mode utilisateur par défaut 
    setShareMode('utilisateur');
    
    setShareEmail('');
    setSharePassword('');
    setExpiryDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Réinitialiser à +7 jours
    setShowDatePicker(false);
    setShareLink('');
    setShowShareModal(true);
  };

  const handleShare = async () => {
    if (!itemToShare) return;

    try {
      const dossierId = itemToShare.type === 'folder' 
        ? itemToShare.dossier?.idDossier 
        : currentDossierId || userRootFolderId;
      
      if (!dossierId) {
        Alert.alert('Erreur', 'Impossible de déterminer le dossier');
        return;
      }

      if (shareMode === 'utilisateur') {
        // Partage interne à un utilisateur
        if (!shareEmail.trim()) {
          Alert.alert('Erreur', 'Veuillez entrer une adresse email');
          return;
        }

        await lienApi.shareToUser(dossierId, { email: shareEmail });
        Alert.alert('Succès', `Dossier partagé avec ${shareEmail}`);
        
        // Fermer le modal
        setShowShareModal(false);
        setShareEmail('');
        
      } else {
        // Création d'un lien pour invité
        if (!sharePassword.trim()) {
          Alert.alert('Erreur', 'Veuillez définir un mot de passe');
          return;
        }

        // Formater la date au format ISO pour l'API
        const formattedDate = expiryDate.toISOString();

        const data: any = {
          motDePasse: sharePassword,
          dateExpiration: formattedDate,
        };

        // Si c'est un fichier, ajouter le nom du fichier
        if (itemToShare.type === 'file' && itemToShare.fichier) {
          data.fileName = itemToShare.fichier.nom;
        }

        const response = await lienApi.createGuestLink(dossierId, data);
        
        if (response.token) {
          const fullLink = `${API_BASE_URL}/liens/${response.token}`;
          setShareLink(fullLink);
        }
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.error || 'Impossible de partager');
    }
  };

  const copyShareLink = async () => {
    if (shareLink) {
      await Clipboard.setStringAsync(shareLink);
      Alert.alert('Succès', 'Lien copié dans le presse-papier');
    }
  };

  const showItemOptions = (item: DisplayItem) => {
    setSelectedItem(item);
    setShowOptionsModal(true);
  };

  const handleOptionPress = async (action: string) => {
    setShowOptionsModal(false);
    
    if (!selectedItem) return;

    // Petit délai pour permettre au modal de se fermer proprement
    await new Promise(resolve => setTimeout(resolve, 100));

    switch (action) {
      case 'open':
        if (selectedItem.type === 'folder' && selectedItem.dossier) {
          navigateToFolder(selectedItem.dossier);
        } else {
          handleFilePress(selectedItem);
        }
        break;
      case 'download':
        handleDownloadFile(selectedItem);
        break;
      case 'zip':
        handleDownloadZip(selectedItem);
        break;
      case 'move':
        openMoveModal(selectedItem);
        break;
      case 'share':
        openShareModal(selectedItem);
        break;
      case 'trash':
        handleMoveToTrash(selectedItem);
        break;
      case 'restore':
        handleRestore(selectedItem);
        break;
      case 'delete':
        handleDeletePermanently(selectedItem);
        break;
    }
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
    <View
      style={[styles.fileItem, { backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF' }]}
    >
      <TouchableOpacity
        style={styles.fileItemContent}
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
          <Image 
            source={item.type === 'folder' ? require('../assets/dossier.png') : getFileIcon(item.name)} 
            style={styles.iconImage}
          />
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
      </TouchableOpacity>
      
      {!isInTrash && (
        <TouchableOpacity
          style={styles.trashButton}
          onPress={() => handleMoveToTrash(item)}
        >
          <Image source={require('../assets/corbeille.png')} style={styles.trashIconImage} />
        </TouchableOpacity>
      )}
      
      <TouchableOpacity onPress={() => showItemOptions(item)} style={styles.moreButton}>
        <Text style={{ fontSize: 20, color: theme.textColor }}>⋮</Text>
      </TouchableOpacity>
    </View>
  );

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    // Extensions d'images
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'];
    // Extensions de documents
    const docExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'];
    // Extensions de vidéos
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v'];
    // Extensions audio
    const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus', 'aiff', 'alac'];
    
    if (extension && imageExtensions.includes(extension)) {
      return require('../assets/image.png');
    } else if (extension && docExtensions.includes(extension)) {
      return require('../assets/docs.png');
    } else if (extension && videoExtensions.includes(extension)) {
      return require('../assets/referencement-video.png');
    } else if (extension && audioExtensions.includes(extension)) {
      return require('../assets/fichier-audio.png');
    } else {
      return require('../assets/lien.png');
    }
  };

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
      {renderBreadcrumb()}

      {/* Boutons d'action */}
      <View style={styles.actionBar}>
        {!isInTrash ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primaryColor }]}
              onPress={() => setShowCreateModal(true)}
            >
              <View style={styles.actionButtonContent}>
                <Image source={require('../assets/dossier.png')} style={styles.actionButtonIcon} />
                <Text style={styles.actionButtonText}> Nouveau</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primaryColor }]}
              onPress={() => navigation.navigate('Upload')}
            >
              <View style={styles.actionButtonContent}>
                <Image source={require('../assets/uploader-des-fichiers.png')} style={styles.actionButtonIcon} />
                <Text style={styles.actionButtonText}> Upload</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
              onPress={navigateToTrash}
            >
              <View style={styles.actionButtonContent}>
                <Image source={require('../assets/corbeille.png')} style={styles.actionButtonIcon} />
                <Text style={styles.actionButtonText}> Corbeille</Text>
              </View>
            </TouchableOpacity>
          </>
        ) : (
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
            <Image source={require('../assets/dossier.png')} style={styles.emptyIconImage} />
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

      {/* Modal de déplacement */}
      <Modal
        visible={showMoveModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMoveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundColor, maxHeight: '80%' }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>
              Déplacer "{itemToMove?.name}"
            </Text>
            
            {/* Navigation dans les dossiers */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.moveBreadcrumb, { backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7' }]}
            >
              {moveBreadcrumb.map((crumb, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => navigateInMoveModal(crumb.id, crumb.name)}
                >
                  <Text style={[styles.breadcrumbText, { color: theme.textColor }]}>
                    {crumb.name} {index < moveBreadcrumb.length - 1 ? ' / ' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Liste des dossiers disponibles */}
            <ScrollView style={styles.folderList}>
              {moveAvailableFolders.map((folder) => (
                <TouchableOpacity
                  key={folder.idDossier}
                  style={[styles.folderItem, { backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7' }]}
                  onPress={() => navigateInMoveModal(folder.idDossier, folder.cheminDaccesDossier.split('/').pop() || folder.cheminDaccesDossier)}
                >
                  <Image source={require('../assets/dossier.png')} style={styles.folderIconImage} />
                  <Text style={[styles.folderName, { color: theme.textColor }]}>
                    {folder.cheminDaccesDossier.split('/').pop() || folder.cheminDaccesDossier}
                  </Text>
                  <Text style={[styles.folderArrow, { color: theme.textColor }]}>›</Text>
                </TouchableOpacity>
              ))}
              {moveAvailableFolders.length === 0 && (
                <Text style={[styles.emptyText, { color: theme.textColor, textAlign: 'center', marginTop: 20 }]}>
                  Aucun sous-dossier
                </Text>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowMoveModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primaryColor }]}
                onPress={confirmMove}
              >
                <Text style={styles.modalButtonText}>Déplacer ici</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de partage */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundColor }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>
              Partager "{itemToShare?.name}"
            </Text>
            
            {/* Boutons de sélection du mode (seulement pour les dossiers) */}
            {itemToShare?.type === 'folder' && !shareLink && (
              <View style={styles.shareModeButtons}>
                <TouchableOpacity
                  style={[
                    styles.shareModeButton,
                    shareMode === 'utilisateur' && { backgroundColor: theme.primaryColor },
                    shareMode !== 'utilisateur' && { backgroundColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }
                  ]}
                  onPress={() => setShareMode('utilisateur')}
                >
                  <Text style={[
                    styles.shareModeButtonText,
                    { color: shareMode === 'utilisateur' ? '#FFFFFF' : theme.textColor }
                  ]}>
                    Utilisateur
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.shareModeButton,
                    shareMode === 'invité' && { backgroundColor: theme.primaryColor },
                    shareMode !== 'invité' && { backgroundColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }
                  ]}
                  onPress={() => setShareMode('invité')}
                >
                  <Text style={[
                    styles.shareModeButtonText,
                    { color: shareMode === 'invité' ? '#FFFFFF' : theme.textColor }
                  ]}>
                    Invité
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Description du mode */}
            <Text style={[styles.modalSubtitle, { color: theme.textColor }]}>
              {shareMode === 'utilisateur' 
                ? 'Collaborer avec un utilisateur' 
                : 'Partager à un invité'}
            </Text>
            
            {!shareLink ? (
              <>
                {shareMode === 'utilisateur' ? (
                  // Mode utilisateur : seulement l'email
                  <>
                    <Text style={[styles.modalDescription, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                      Entrez l'adresse email de l'utilisateur
                    </Text>
                    <TextInput
                      style={[
                        styles.modalInput,
                        {
                          backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7',
                          color: theme.textColor,
                        },
                      ]}
                      placeholder="email@example.com"
                      placeholderTextColor={theme.isDark ? '#8E8E93' : '#6C6C70'}
                      value={shareEmail}
                      onChangeText={setShareEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoFocus
                    />
                  </>
                ) : (
                  // Mode invité : mot de passe et date d'expiration
                  <>
                    <Text style={[styles.modalDescription, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                      Définissez un mot de passe et une date d'expiration
                    </Text>
                    <TextInput
                      style={[
                        styles.modalInput,
                        {
                          backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7',
                          color: theme.textColor,
                          marginBottom: 10,
                        },
                      ]}
                      placeholder="Mot de passe"
                      placeholderTextColor={theme.isDark ? '#8E8E93' : '#6C6C70'}
                      value={sharePassword}
                      onChangeText={setSharePassword}
                      secureTextEntry
                      autoFocus
                    />
                    
                    <TouchableOpacity
                      style={[
                        styles.datePickerButton,
                        {
                          backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7',
                        },
                      ]}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={[styles.datePickerButtonText, { color: theme.textColor }]}>
                        📅 {expiryDate.toLocaleDateString('fr-FR', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                      <DateTimePicker
                        value={expiryDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        minimumDate={new Date()}
                        onChange={(event: any, selectedDate?: Date) => {
                          if (Platform.OS === 'android') {
                            setShowDatePicker(false);
                          }
                          if (selectedDate) {
                            setExpiryDate(selectedDate);
                          }
                        }}
                      />
                    )}

                    {Platform.OS === 'ios' && showDatePicker && (
                      <TouchableOpacity
                        style={[styles.datePickerCloseButton, { backgroundColor: theme.primaryColor }]}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={styles.datePickerCloseButtonText}>OK</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </>
            ) : (
              // Affichage du lien créé
              <>
                <Text style={[styles.modalDescription, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                  Lien de partage créé :
                </Text>
                <View style={[styles.linkContainer, { backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                  <Text style={[styles.linkText, { color: theme.primaryColor }]} numberOfLines={2}>
                    {shareLink}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.primaryColor, marginTop: 10 }]}
                  onPress={copyShareLink}
                >
                  <View style={styles.modalButtonContent}>
                    <Image source={require('../assets/copier-le-lien.png')} style={styles.modalButtonIcon} />
                    <Text style={styles.modalButtonText}> Copier le lien</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.modalButtons}>
              {!shareLink ? (
                <>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setShowShareModal(false);
                      setShareEmail('');
                      setSharePassword('');
                      setShowDatePicker(false);
                      setShareLink('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: theme.primaryColor }]}
                    onPress={handleShare}
                  >
                    <Text style={styles.modalButtonText}>
                      {shareMode === 'utilisateur' ? 'Confirmer' : 'Générer'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.primaryColor }]}
                  onPress={() => {
                    setShowShareModal(false);
                    setShareEmail('');
                    setSharePassword('');
                    setShowDatePicker(false);
                    setShareLink('');
                  }}
                >
                  <Text style={styles.modalButtonText}>Fermer</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal d'options */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
        >
          <View
            style={[styles.optionsModalContent, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF' }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.optionsHeader}>
              <Text style={[styles.optionsTitle, { color: theme.textColor }]}>
                {selectedItem?.name}
              </Text>
            </View>

            <ScrollView style={styles.optionsList}>
              {selectedItem && (
                <>
                  {isInTrash ? (
                    // Options dans la corbeille
                    <>
                      <TouchableOpacity
                        style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]}
                        onPress={() => handleOptionPress('restore')}
                      >
                        <Image source={require('../assets/restaurer.png')} style={styles.optionIconImage} />
                        <Text style={[styles.optionText, { color: theme.textColor }]}>Restaurer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]}
                        onPress={() => handleOptionPress('delete')}
                      >
                        <Image source={require('../assets/corbeille.png')} style={styles.optionIconImage} />
                        <Text style={[styles.optionText, { color: '#FF3B30' }]}>Supprimer définitivement</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    // Options hors corbeille
                    <>
                      {selectedItem.type === 'folder' ? (
                        <TouchableOpacity
                          style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]}
                          onPress={() => handleOptionPress('open')}
                        >
                          <Image source={require('../assets/dossier.png')} style={styles.optionIconImage} />
                          <Text style={[styles.optionText, { color: theme.textColor }]}>Ouvrir</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]}
                          onPress={() => handleOptionPress('download')}
                        >
                          <Image source={require('../assets/telecharger.png')} style={styles.optionIconImage} />
                          <Text style={[styles.optionText, { color: theme.textColor }]}>Télécharger</Text>
                        </TouchableOpacity>
                      )}

                      {selectedItem.type === 'folder' && (
                        <TouchableOpacity
                          style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]}
                          onPress={() => handleOptionPress('zip')}
                        >
                          <Image source={require('../assets/telecharger-zip.png')} style={styles.optionIconImage} />
                          <Text style={[styles.optionText, { color: theme.textColor }]}>Télécharger en ZIP</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]}
                        onPress={() => handleOptionPress('move')}
                      >
                        <Image source={require('../assets/deplacer-le-fichier.png')} style={styles.optionIconImage} />
                        <Text style={[styles.optionText, { color: theme.textColor }]}>Déplacer</Text>
                      </TouchableOpacity>

                      {selectedItem.type === 'folder' && (
                        <TouchableOpacity
                          style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]}
                          onPress={() => handleOptionPress('share')}
                        >
                          <Image source={require('../assets/lien.png')} style={styles.optionIconImage} />
                          <Text style={[styles.optionText, { color: theme.textColor }]}>Créer un lien de partage</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.cancelOptionButton, { borderTopColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]}
              onPress={() => setShowOptionsModal(false)}
            >
              <Text style={[styles.cancelOptionText, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {fileToView && (
        <FileViewer
          visible={showFileViewer}
          fileUrl={fileToView.url}
          fileName={fileToView.name}
          onClose={() => {
            setShowFileViewer(false);
            setFileToView(null);
          }}
        />
      )}
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
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonIcon: {
    width: 18,
    height: 18,
    marginRight: 4,
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
  fileItemContent: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  fileIcon: {
    marginRight: 12,
  },
  iconImage: {
    width: 32,
    height: 32,
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
  trashButton: {
    padding: 8,
    marginLeft: 4,
  },
  trashIconImage: {
    width: 20,
    height: 20,
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
  emptyIconImage: {
    width: 60,
    height: 60,
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
  shareModeButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  shareModeButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareModeButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  datePickerButton: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginBottom: 20,
  },
  datePickerButtonText: {
    fontSize: 16,
  },
  datePickerCloseButton: {
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  datePickerCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  modalButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalButtonIcon: {
    width: 18,
    height: 18,
    tintColor: '#FFFFFF',
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
  moveBreadcrumb: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  folderList: {
    maxHeight: 300,
    marginVertical: 10,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
  },
  folderIconImage: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  folderName: {
    flex: 1,
    fontSize: 16,
  },
  folderArrow: {
    fontSize: 20,
    opacity: 0.5,
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
  },
  linkContainer: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  linkText: {
    fontSize: 14,
    textAlign: 'center',
  },
  optionsModalContent: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionsHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  optionsTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionsList: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  optionIconImage: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  cancelOptionButton: {
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  cancelOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
