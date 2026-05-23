import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useMobileTheme } from '../context/MobileThemeContext';
import { useUpload } from '../hooks/useUpload';
import { styles } from '../styles/UploadScreen.styles';

export default function UploadScreen({ navigation }: any) {
  const {
    selectedFiles,
    uploading,
    uploadProgress,
    dossiers,
    selectedDossier,
    loadingDossiers,
    currentDossierId,
    userRootFolderId,
    breadcrumb,
    navigateToFolder,
    navigateToLevel,
    selectCurrentFolder,
    pickDocument,
    pickImage,
    takePhoto,
    removeFile,
    uploadFiles,
    formatFileSize,
  } = useUpload(navigation);
  const { theme } = useMobileTheme();

  // Affichage de l'écran d'upload
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
                    <Image source={require('../assets/dossier.png')} style={styles.folderIconImage} />
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
            <Image source={require('../assets/docs.png')} style={styles.optionIconImage} />
            <Text style={styles.optionText}>Document</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionButton, { backgroundColor: theme.primaryColor }]}
            onPress={pickImage}
          >
            <Image source={require('../assets/galerie.png')} style={styles.optionIconImage} />
            <Text style={styles.optionText}>Galerie</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionButton, { backgroundColor: theme.primaryColor }]}
            onPress={takePhoto}
          >
            <Image source={require('../assets/camera.png')} style={styles.optionIconImage} />
            <Text style={styles.optionText}>Photo</Text>
          </TouchableOpacity>
        </View>

        {selectedFiles.length > 0 && (
          <View style={styles.filesSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Image source={require('../assets/exportation-de-fichiers.png')} style={styles.sectionTitleIcon} />
              <Text style={[styles.sectionTitle, { marginBottom: 0, color: theme.textColor }]}>
                Fichiers sélectionnés ({selectedFiles.length})
              </Text>
            </View>

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
            <Image source={require('../assets/exportation-de-fichiers.png')} style={styles.emptyIconImage} />
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