import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useMobileTheme } from '../context/MobileThemeContext';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { dossierApi, Dossier } from '../api/api';

interface BreadcrumbItem {
  id: number | null;
  name: string;
}

export default function UploadScreen({ navigation }: any) {
  const { theme } = useMobileTheme();
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [loadingDossiers, setLoadingDossiers] = useState(true);
  const [currentDossierId, setCurrentDossierId] = useState<number | null>(null);
  const [userRootFolderId, setUserRootFolderId] = useState<number | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([{ id: null, name: 'Racine' }]);

  useEffect(() => {
    loadDossiers();
  }, [currentDossierId]);

  const loadDossiers = async () => {
    try {
      setLoadingDossiers(true);
      const userId = user?.id || 0;
      
      let dossiersDisponibles: Dossier[] = [];
      
      if (currentDossierId === null) {
        // On est à la racine - charger le contenu de user_X
        const dossiersRacine = await dossierApi.getDossiersRacine(userId);
        const userFolder = dossiersRacine.find(d => d.cheminDaccesDossier === `user_${userId}`);
        
        if (userFolder) {
          // Sauvegarder l'ID du dossier user_X
          setUserRootFolderId(userFolder.idDossier);
          
          // Charger les sous-dossiers de user_X
          dossiersDisponibles = await dossierApi.getSousDossiers(userFolder.idDossier);
          
          // Filtrer .corbeille
          dossiersDisponibles = dossiersDisponibles.filter(
            d => !d.cheminDaccesDossier.includes('.corbeille')
          );
        }
      } else {
        // On est dans un sous-dossier - charger ses sous-dossiers
        dossiersDisponibles = await dossierApi.getSousDossiers(currentDossierId);
        
        // Filtrer .corbeille
        dossiersDisponibles = dossiersDisponibles.filter(
          d => !d.cheminDaccesDossier.includes('.corbeille')
        );
      }
      
      setDossiers(dossiersDisponibles);
    } catch (error) {
      console.error('Erreur lors du chargement des dossiers:', error);
      Alert.alert('Erreur', 'Impossible de charger les dossiers');
    } finally {
      setLoadingDossiers(false);
    }
  };

  const navigateToFolder = (dossier: Dossier) => {
    const folderName = dossier.cheminDaccesDossier.split('/').pop() || dossier.cheminDaccesDossier;
    setBreadcrumb([...breadcrumb, { id: dossier.idDossier, name: folderName }]);
    setCurrentDossierId(dossier.idDossier);
  };

  const navigateToLevel = (index: number) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1);
    setBreadcrumb(newBreadcrumb);
    setCurrentDossierId(newBreadcrumb[newBreadcrumb.length - 1].id);
  };

  const selectCurrentFolder = () => {
    // Sélectionner le dossier courant comme destination
    const dossierId = currentDossierId || userRootFolderId;
    if (dossierId) {
      setSelectedDossier({ 
        idDossier: dossierId, 
        cheminDaccesDossier: breadcrumb[breadcrumb.length - 1].name,
        idCompteCreateur: user?.id || 0,
        idDossierParent: null
      } as Dossier);
      Alert.alert('Dossier sélectionné', `Destination : ${breadcrumb[breadcrumb.length - 1].name}`);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        setSelectedFiles([...selectedFiles, ...result.assets]);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du document:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission requise', 'Vous devez autoriser l\'accès à la galerie');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        setSelectedFiles([...selectedFiles, ...result.assets]);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission requise', 'Vous devez autoriser l\'accès à la caméra');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        setSelectedFiles([...selectedFiles, ...result.assets]);
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  // Fonction pour obtenir l'extension depuis le mimeType
  const getExtensionFromMimeType = (mimeType: string): string => {
    const mimeToExt: { [key: string]: string } = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/bmp': '.bmp',
      'image/svg+xml': '.svg',
      'video/mp4': '.mp4',
      'video/mpeg': '.mpeg',
      'video/quicktime': '.mov',
      'video/x-msvideo': '.avi',
      'video/webm': '.webm',
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'audio/ogg': '.ogg',
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'application/vnd.ms-powerpoint': '.ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
      'application/zip': '.zip',
      'application/x-rar-compressed': '.rar',
      'text/plain': '.txt',
      'text/html': '.html',
      'text/css': '.css',
      'text/javascript': '.js',
      'application/json': '.json',
    };
    return mimeToExt[mimeType] || '';
  };

  // Fonction pour générer un nom de fichier avec extension
  const generateFileName = (file: any, index: number): string => {
    let fileName = file.name;
    
    // Si pas de nom ou pas d'extension dans le nom
    if (!fileName || !fileName.includes('.')) {
      const extension = getExtensionFromMimeType(file.mimeType || file.type || '');
      
      if (fileName) {
        // Le fichier a un nom mais pas d'extension
        fileName = fileName + extension;
      } else {
        // Pas de nom du tout, générer un nom avec timestamp et extension
        const timestamp = new Date().getTime();
        fileName = `fichier_${timestamp}_${index}${extension}`;
      }
    }
    
    return fileName;
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert('Aucun fichier', 'Veuillez sélectionner au moins un fichier');
      return;
    }

    if (!selectedDossier) {
      Alert.alert('Aucun dossier', 'Veuillez sélectionner un dossier de destination');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Uploader chaque fichier individuellement
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();

        const fileUri = file.uri;
        const fileName = generateFileName(file, i);
        const fileType = file.mimeType || file.type || 'application/octet-stream';

        formData.append('fichier', {
          uri: fileUri,
          name: fileName,
          type: fileType,
        } as any);

        // Mise à jour de la progression
        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));

        await apiClient.post(`/api/dossiers/${selectedDossier.idDossier}/televerser`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      Alert.alert(
        'Succès',
        `${selectedFiles.length} fichier(s) uploadé(s) avec succès`,
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedFiles([]);
              setUploadProgress(0);
              navigation.navigate('Documents');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Erreur lors de l\'upload:', error);
      Alert.alert('Erreur', error.response?.data?.message || 'Échec de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.textColor }]}>Uploader des fichiers</Text>
        <Text style={[styles.subtitle, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
          Sélectionnez des fichiers depuis votre appareil
        </Text>

        {/* Navigation et sélection du dossier de destination */}
        {loadingDossiers ? (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="small" color={theme.primaryColor} />
            <Text style={[styles.loadingText, { color: theme.textColor }]}>
              Chargement des dossiers...
            </Text>
          </View>
        ) : (
          <View style={styles.destinationSection}>
            <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
              Dossier de destination
            </Text>
            
            {/* Breadcrumb */}
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

            {/* Bouton pour uploader dans le dossier courant */}
            <TouchableOpacity
              style={[
                styles.currentFolderButton,
                { 
                  backgroundColor: selectedDossier?.idDossier === (currentDossierId || userRootFolderId)
                    ? theme.primaryColor 
                    : theme.isDark ? '#2C2C2E' : '#F2F2F7',
                  borderWidth: 2,
                  borderColor: theme.primaryColor,
                }
              ]}
              onPress={selectCurrentFolder}
            >
              <Text
                style={[
                  styles.currentFolderButtonText,
                  { 
                    color: selectedDossier?.idDossier === (currentDossierId || userRootFolderId)
                      ? '#FFFFFF' 
                      : theme.primaryColor 
                  },
                ]}
              >
                ✓ Uploader dans "{breadcrumb[breadcrumb.length - 1].name}"
              </Text>
            </TouchableOpacity>

            {/* Liste des sous-dossiers */}
            {dossiers.length > 0 ? (
              <View style={styles.foldersList}>
                <Text style={[styles.subSectionTitle, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                  Sous-dossiers disponibles :
                </Text>
                {dossiers.map((dossier) => (
                  <TouchableOpacity
                    key={dossier.idDossier}
                    style={[
                      styles.folderItem,
                      { backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF' },
                    ]}
                    onPress={() => navigateToFolder(dossier)}
                  >
                    <Text style={styles.folderIcon}>📁</Text>
                    <Text style={[styles.folderName, { color: theme.textColor }]}>
                      {dossier.cheminDaccesDossier.split('/').pop() || dossier.cheminDaccesDossier}
                    </Text>
                    <Text style={[styles.chevron, { color: theme.textColor }]}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={[styles.noSubFolders, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                Aucun sous-dossier
              </Text>
            )}
          </View>
        )}

        <View style={styles.uploadOptions}>
          <TouchableOpacity
            style={[styles.optionButton, { backgroundColor: theme.primaryColor }]}
            onPress={pickDocument}
          >
            <Text style={styles.optionIcon}>📄</Text>
            <Text style={styles.optionText}>Document</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionButton, { backgroundColor: theme.primaryColor }]}
            onPress={pickImage}
          >
            <Text style={styles.optionIcon}>🖼️</Text>
            <Text style={styles.optionText}>Galerie</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionButton, { backgroundColor: theme.primaryColor }]}
            onPress={takePhoto}
          >
            <Text style={styles.optionIcon}>📷</Text>
            <Text style={styles.optionText}>Photo</Text>
          </TouchableOpacity>
        </View>

        {selectedFiles.length > 0 && (
          <View style={styles.filesSection}>
            <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
              Fichiers sélectionnés ({selectedFiles.length})
            </Text>

            {selectedFiles.map((file, index) => (
              <View
                key={index}
                style={[
                  styles.fileItem,
                  { backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7' },
                ]}
              >
                <View style={styles.fileInfo}>
                  <Text style={[styles.fileName, { color: theme.textColor }]} numberOfLines={1}>
                    {file.name || `Fichier ${index + 1}`}
                  </Text>
                  {file.size && (
                    <Text style={[styles.fileSize, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                      {formatFileSize(file.size)}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => removeFile(index)} style={styles.removeButton}>
                  <Text style={styles.removeIcon}>❌</Text>
                </TouchableOpacity>
              </View>
            ))}

            {uploading && (
              <View style={styles.progressSection}>
                <Text style={[styles.progressText, { color: theme.textColor }]}>
                  Upload en cours... {uploadProgress}%
                </Text>
                <View style={[styles.progressBar, { backgroundColor: theme.isDark ? '#3A3A3C' : '#E5E5EA' }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${uploadProgress}%`, backgroundColor: theme.primaryColor },
                    ]}
                  />
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.uploadButton,
                { backgroundColor: theme.primaryColor },
                uploading && styles.uploadButtonDisabled,
              ]}
              onPress={uploadFiles}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.uploadButtonText}>Uploader {selectedFiles.length} fichier(s)</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {selectedFiles.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7' }]}>
            <Text style={styles.emptyIcon}>📤</Text>
            <Text style={[styles.emptyText, { color: theme.textColor }]}>
              Aucun fichier sélectionné
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
              Appuyez sur un bouton ci-dessus pour commencer
            </Text>
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
    marginBottom: 24,
  },
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginBottom: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
  },
  destinationSection: {
    marginBottom: 20,
  },
  breadcrumb: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
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
  },
  currentFolderButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  currentFolderButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  foldersList: {
    marginTop: 8,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  folderIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  folderName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
  },
  noSubFolders: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  dossierList: {
    flexDirection: 'row',
  },
  dossierChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  dossierChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 12,
  },
  optionButton: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  filesSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
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
    fontSize: 14,
  },
  removeButton: {
    padding: 8,
  },
  removeIcon: {
    fontSize: 18,
  },
  progressSection: {
    marginVertical: 20,
  },
  progressText: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  uploadButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 64,
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
});
