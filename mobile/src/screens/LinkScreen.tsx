import React from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { useMobileTheme } from '../context/MobileThemeContext';
import FileViewer from '../components/FileViewer';
import { useLink, DisplayItem } from '../hooks/useLink';
import { styles } from '../styles/LinkScreen.styles';

interface LinkScreenProps {
  route: any;
  navigation: any;
}

export default function LinkScreen({ route, navigation }: LinkScreenProps) {
  const { token, password, linkDetails: initialDetails } = route.params;
  const { theme } = useMobileTheme();

  const {
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
    handleFolderPress,
    handleBackPress,
    handleFilePress,
    showItemOptions,
    handleOptionPress,
    formatFileSize,
  } = useLink(token, password, initialDetails, navigation);

  // Fonction pour déterminer l'icône à afficher selon le type de fichier
  const getFileIcon = (fileName: string) => {
    if (!fileName) return require('../assets/lien.png');
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'];
    const docExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'];
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus', 'aiff', 'alac'];
    
    if (extension && imageExtensions.includes(extension)) return require('../assets/image.png');
    if (extension && docExtensions.includes(extension)) return require('../assets/docs.png');
    if (extension && videoExtensions.includes(extension)) return require('../assets/referencement-video.png');
    if (extension && audioExtensions.includes(extension)) return require('../assets/fichier-audio.png');
    return require('../assets/lien.png');
  };

  // Affiche le fil d'ariane
  const renderBreadcrumb = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.breadcrumb, { backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7' }]}
    >
      {navigationStack.map((crumb, index) => (
        <View key={index} style={styles.breadcrumbItem}>
          <TouchableOpacity onPress={() => {
            if (index === 0) {
              handleBackPress();
            }
          }}>
            <Text
              style={[
                styles.breadcrumbText,
                { color: index === navigationStack.length - 1 ? theme.primaryColor : theme.textColor },
              ]}
            >
              {crumb.nom}
            </Text>
          </TouchableOpacity>
          {index < navigationStack.length - 1 && (
            <Text style={[styles.breadcrumbSeparator, { color: theme.textColor }]}> / </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );

  // Affiche contenu
  const renderFileItem = ({ item }: { item: DisplayItem }) => (
    <View style={[styles.fileItem, { backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF' }]}>
      <TouchableOpacity
        style={styles.fileItemContent}
        onPress={() => {
          if (item.type === 'folder' && item.dossier) {
            handleFolderPress(item.dossier);
          } else if (item.type === 'file') {
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
      
      <TouchableOpacity onPress={() => showItemOptions(item)} style={styles.moreButton}>
        <Text style={{ fontSize: 20, color: theme.textColor }}>⋮</Text>
      </TouchableOpacity>
    </View>
  );

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

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primaryColor }]}
          onPress={handleBackPress}
        >
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionButtonText}>← Retour</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primaryColor }]}
          onPress={() => handleOptionPress('zip')}
        >
          <View style={styles.actionButtonContent}>
            <Image source={require('../assets/telecharger-zip.png')} style={styles.actionButtonIcon} />
            <Text style={styles.actionButtonText}> ZIP</Text>
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderFileItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Image source={require('../assets/dossier.png')} style={styles.emptyIconImage} />
            <Text style={[styles.emptyText, { color: theme.textColor }]}>Dossier vide</Text>
            <Text style={[styles.emptySubtext, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
              Ce dossier ne contient aucun fichier
            </Text>
          </View>
        }
        contentContainerStyle={items.length === 0 ? styles.emptyList : undefined}
      />

      <Modal visible={showOptionsModal} transparent animationType="fade" onRequestClose={() => setShowOptionsModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOptionsModal(false)}>
          <View style={[styles.optionsModalContent, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF' }]} onStartShouldSetResponder={() => true}>
            <View style={styles.optionsHeader}>
              <Text style={[styles.optionsTitle, { color: theme.textColor }]}>{selectedItem?.name}</Text>
            </View>
            <ScrollView style={styles.optionsList}>
              {selectedItem && (
                <>
                  {selectedItem.type === 'folder' ? (
                    <>
                      <TouchableOpacity 
                        style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]} 
                        onPress={() => handleOptionPress('open')}
                      >
                        <Image source={require('../assets/dossier.png')} style={styles.optionIconImage} />
                        <Text style={[styles.optionText, { color: theme.textColor }]}>Ouvrir</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]} 
                        onPress={() => handleOptionPress('zip')}
                      >
                        <Image source={require('../assets/telecharger-zip.png')} style={styles.optionIconImage} />
                        <Text style={[styles.optionText, { color: theme.textColor }]}>Télécharger en ZIP</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]} 
                      onPress={() => handleOptionPress('download')}
                    >
                      <Image source={require('../assets/telecharger.png')} style={styles.optionIconImage} />
                      <Text style={[styles.optionText, { color: theme.textColor }]}>Télécharger</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Visualiseur de fichiers */}
      {showFileViewer && fileToView && (
        <FileViewer 
          visible={showFileViewer} 
          fileUrl={fileToView.url} 
          fileName={fileToView.name} 
          isPublic={true}
          onClose={() => { 
            setShowFileViewer(false); 
            setFileToView(null); 
          }} 
        />
      )}
    </View>
  );
}
