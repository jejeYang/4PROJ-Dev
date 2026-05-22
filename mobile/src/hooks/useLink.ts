import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { API_BASE_URL } from '../config';

export interface Fichier {
  nom: string;
  taille: number;
  dateModification: string;
  type?: string;
}

export interface SousDossier {
  idDossier: number;
  cheminDaccesDossier: string;
}

export interface LinkDetails {
  type: string;
  nom: string;
  idDossier: number;
  isRacinePartage: boolean;
  fichiers?: Fichier[];
  sousDossiers?: SousDossier[];
}

export interface NavigationStackItem {
  idDossier: number;
  nom: string;
}

export interface DisplayItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size?: number;
  date?: string;
  dossier?: SousDossier;
  fichier?: Fichier;
}

export function useLink(token: string, password: string, initialDetails: LinkDetails | null, navigation: any) {
  const [currentDetails, setCurrentDetails] = useState<LinkDetails | null>(initialDetails || null);
  const [isLoading, setIsLoading] = useState(!initialDetails);
  const [navigationStack, setNavigationStack] = useState<NavigationStackItem[]>([]);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DisplayItem | null>(null);
  
  // États pour le visualiseur de fichiers
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [fileToView, setFileToView] = useState<{ url: string; name: string } | null>(null);

  const items: DisplayItem[] = [
    ...(currentDetails?.sousDossiers?.map((d) => ({
      id: `folder-${d.idDossier}`,
      name: d.cheminDaccesDossier?.split('/').pop() || d.cheminDaccesDossier || 'Dossier',
      type: 'folder' as const,
      dossier: d,
    })) || []),
    ...(currentDetails?.fichiers?.map((f, index) => {
      let displayName = f.nom || 'Fichier sans nom';
      try {
        displayName = decodeURIComponent(displayName);
      } catch {
      }
      return {
        id: `file-${f.nom || index}-${index}`,
        name: displayName,
        type: 'file' as const,
        size: f.taille,
        date: f.dateModification,
        fichier: f,
      };
    }) || []),
  ];

  useEffect(() => {
    if (!initialDetails) {
      loadLinkDetails();
    } else {
      setNavigationStack([{ idDossier: initialDetails.idDossier, nom: initialDetails.nom || 'Dossier partagé' }]);
    }
  }, []);

  const loadLinkDetails = async (idSousDossier?: number) => {
    try {
      setIsLoading(true);
      const url = idSousDossier 
        ? `/api/liens/${token}/details?password=${encodeURIComponent(password)}&idSousDossier=${idSousDossier}`
        : `/api/liens/${token}/details?password=${encodeURIComponent(password)}`;
      
      const response = await fetch(`${API_BASE_URL}${url}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement');
      }

      setCurrentDetails(data);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de charger le contenu');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderPress = (sousDossier: SousDossier) => {
    const folderName = sousDossier.cheminDaccesDossier?.split('/').pop() || sousDossier.cheminDaccesDossier || 'Dossier';
    setNavigationStack([...navigationStack, { idDossier: sousDossier.idDossier, nom: folderName }]);
    loadLinkDetails(sousDossier.idDossier);
  };

  const handleBackPress = () => {
    if (navigationStack.length > 1) {
      const newStack = [...navigationStack];
      newStack.pop();
      setNavigationStack(newStack);
      const previous = newStack[newStack.length - 1];
      if (previous.idDossier === initialDetails?.idDossier) {
        setCurrentDetails(initialDetails);
        setIsLoading(false);
      } else {
        loadLinkDetails(previous.idDossier);
      }
    } else {
      navigation.goBack();
    }
  };

  const handleFilePress = (item: DisplayItem) => {
    if (!item.fichier || !item.fichier.nom) return;
    
    // URL pour visualiser le fichier via l'API de lien partagé
    const fileUrl = `${API_BASE_URL}/api/liens/${token}?password=${encodeURIComponent(password)}&idDossier=${currentDetails?.idDossier}&fileName=${encodeURIComponent(item.fichier.nom)}`;
    setFileToView({ url: fileUrl, name: item.name });
    setShowFileViewer(true);
  };

  const showItemOptions = (item: DisplayItem) => {
    setSelectedItem(item);
    setShowOptionsModal(true);
  };

  const handleOptionPress = (action: string) => {
    setShowOptionsModal(false);
    
    if (action === 'open' && selectedItem?.dossier) {
      handleFolderPress(selectedItem.dossier);
    } else if (action === 'download' && selectedItem?.fichier) {
      downloadFile(selectedItem.fichier);
    } else if (action === 'zip') {
      downloadFolderAsZip();
    }
  };

  const downloadFolderAsZip = async () => {
    try {
      if (!currentDetails) return;
      
      const folderName = navigationStack[navigationStack.length - 1]?.nom || 'dossier';
      const docDir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || '';
      const fileUri = `${docDir}${folderName}.zip`;
      
      Alert.alert('Téléchargement', `Téléchargement du dossier en ZIP...`);

      const url = `${API_BASE_URL}/api/liens/${token}?password=${encodeURIComponent(password)}&idDossier=${currentDetails.idDossier}&download=true`;
      
      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      if (downloadResult.status === 200) {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/zip',
            dialogTitle: `Enregistrer ${folderName}.zip`
          });
        } else {
          Alert.alert('Succès', 'Dossier téléchargé: ' + downloadResult.uri);
        }
      } else {
        Alert.alert('Erreur', 'Échec du téléchargement');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de télécharger le dossier');
    }
  };

  const downloadFile = async (fichier: Fichier) => {
    try {
      const fileName = fichier.nom || 'fichier';
      if (!fichier.nom) {
        Alert.alert('Erreur', 'Nom de fichier manquant');
        return;
      }
      
      const docDir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || '';
      const fileUri = `${docDir}${fileName}`;
      
      Alert.alert('Téléchargement', `Téléchargement de ${fileName}...`);

      const url = `${API_BASE_URL}/api/liens/${token}?password=${encodeURIComponent(password)}&idDossier=${currentDetails?.idDossier}&fileName=${encodeURIComponent(fileName)}&download=true`;
      
      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      if (downloadResult.status === 200) {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/octet-stream',
            dialogTitle: `Enregistrer ${fileName}`
          });
        } else {
          Alert.alert('Succès', 'Fichier téléchargé: ' + downloadResult.uri);
        }
      } else {
        Alert.alert('Erreur', 'Échec du téléchargement');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de télécharger le fichier');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' Go';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return {
    currentDetails,
    isLoading,
    navigationStack,
    items,
    showOptionsModal,
    setShowOptionsModal,
    selectedItem,
    showFileViewer,
    setShowFileViewer,
    fileToView,
    setFileToView,
    loadLinkDetails,
    handleFolderPress,
    handleBackPress,
    handleFilePress,
    showItemOptions,
    handleOptionPress,
    downloadFile,
    downloadFolderAsZip,
    formatFileSize,
    formatDate,
  };
}
