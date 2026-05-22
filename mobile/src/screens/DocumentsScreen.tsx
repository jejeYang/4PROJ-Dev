import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMobileTheme } from '../context/MobileThemeContext';
import FileViewer from '../components/FileViewer';
import { useDocuments, DisplayItem } from '../hooks/useDocuments';
import { styles } from '../styles/DocumentsScreen.styles';

export default function DocumentsScreen({ navigation, route }: any) {
  const { theme } = useMobileTheme();

  const {
    items,
    isLoading,
    breadcrumb,
    showCreateModal,
    setShowCreateModal,
    newFolderName,
    setNewFolderName,
    isInTrash,
    trashSize,
    showMoveModal,
    setShowMoveModal,
    itemToMove,
    moveBreadcrumb,
    moveAvailableFolders,
    showShareModal,
    setShowShareModal,
    itemToShare,
    shareMode,
    setShareMode,
    shareEmail,
    setShareEmail,
    sharePassword,
    setSharePassword,
    expiryDate,
    setExpiryDate,
    showDatePicker,
    setShowDatePicker,
    shareLink,
    setShareLink,
    showOptionsModal,
    setShowOptionsModal,
    selectedItem,
    showFileViewer,
    setShowFileViewer,
    fileToView,
    setFileToView,
    loadContent,
    navigateToFolder,
    navigateToTrash,
    navigateToLevel,
    handleCreateFolder,
    handleFilePress,
    handleMoveToTrash,
    handleEmptyTrash,
    navigateInMoveModal,
    confirmMove,
    handleShare,
    copyShareLink,
    showItemOptions,
    handleOptionPress,
    formatFileSize,
    showRenameModal,
    setShowRenameModal,
    newName,
    setNewName,
    handleRename,
    itemToRename,
  } = useDocuments(navigation, route);

  // Fonction pour déterminer l'icône à afficher selon le type de fichier
  const getFileIcon = (fileName: string) => {
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

  // Fonction pour obtenir la date de modification à afficher
  const getModificationDate = (item: DisplayItem) => {
    let dateStr = '';
    if (item.type === 'folder' && item.dossier?.modifieLe) {
      dateStr = item.dossier.modifieLe;
    } else if (item.type === 'file' && item.fichier?.dateModification) {
      dateStr = item.fichier.dateModification;
    }
    return dateStr ? new Date(dateStr).toLocaleDateString('fr-FR') : '';
  };

  // Affiche le fil d'ariane
  const renderBreadcrumb = () => (
    <View style={[styles.breadcrumbContainer, { backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7' }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.breadcrumbContent}
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
    </View>
  );

  // Affiche contenu
  const renderFileItem = ({ item }: { item: DisplayItem }) => (
    <View style={[styles.fileItem, { backgroundColor: theme.isDark ? '#2C2C2E' : '#FFFFFF' }]}>
      <TouchableOpacity
        style={styles.fileItemContent}
        onPress={() => {
          if (item.type === 'folder' && item.dossier) navigateToFolder(item.dossier);
          else handleFilePress(item);
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
          <View style={styles.fileDetails}>
            {item.size !== undefined && (
              <Text style={[styles.fileSize, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                {formatFileSize(item.size)}
              </Text>
            )}
            {getModificationDate(item) !== '' && (
              <Text style={[styles.fileDate, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                {item.size !== undefined ? ' • ' : ''}Modifié le {getModificationDate(item)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
      
      {!isInTrash && (
        <TouchableOpacity style={styles.trashButton} onPress={() => handleMoveToTrash(item)}>
          <Image source={require('../assets/corbeille.png')} style={styles.trashIconImage} />
        </TouchableOpacity>
      )}
      
      <TouchableOpacity onPress={() => showItemOptions(item)} style={styles.moreButton}>
        <Text style={{ fontSize: 20, color: theme.textColor }}>⋮</Text>
      </TouchableOpacity>
    </View>
  );

  // Affichage principal
  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {renderBreadcrumb()}

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

      {/* Chargement */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderFileItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Image source={require('../assets/dossier.png')} style={styles.emptyIconImage} />
              <Text style={[styles.emptyText, { color: theme.textColor }]}>Aucun document</Text>
              <Text style={[styles.emptySubtext, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                Commencez par créer un dossier ou uploader un fichier
              </Text>
            </View>
          }
          refreshing={isLoading}
          onRefresh={loadContent}
          contentContainerStyle={items.length === 0 ? styles.emptyList : undefined}
        />
      )}


      {/* Modal de création de dossier */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundColor }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>Nouveau Dossier</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7', color: theme.textColor }]}
              placeholder="Nom du dossier"
              placeholderTextColor={theme.isDark ? '#8E8E93' : '#6C6C70'}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setShowCreateModal(false); setNewFolderName(''); }}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.primaryColor }]} onPress={handleCreateFolder}>
                <Text style={styles.modalButtonText}>Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de renommage */}
      <Modal visible={showRenameModal} transparent animationType="slide" onRequestClose={() => setShowRenameModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundColor }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>Renommer</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7', color: theme.textColor }]}
              placeholder="Nouveau nom"
              placeholderTextColor={theme.isDark ? '#8E8E93' : '#6C6C70'}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setShowRenameModal(false); setNewName(''); }}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.primaryColor }]} onPress={handleRename}>
                <Text style={styles.modalButtonText}>Renommer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de déplacement */}
      <Modal visible={showMoveModal} transparent animationType="slide" onRequestClose={() => setShowMoveModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundColor, maxHeight: '80%' }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>Déplacer "{itemToMove?.name}"</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.moveBreadcrumb, { backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7' }]}>
              {moveBreadcrumb.map((crumb, index) => (
                <TouchableOpacity key={index} onPress={() => navigateInMoveModal(crumb.id, crumb.name)}>
                  <Text style={[styles.breadcrumbText, { color: theme.textColor }]}>
                    {crumb.name} {index < moveBreadcrumb.length - 1 ? ' / ' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView style={styles.folderList}>
              {moveAvailableFolders.map((folder) => (
                <TouchableOpacity key={folder.idDossier} style={[styles.folderItem, { backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7' }]} onPress={() => navigateInMoveModal(folder.idDossier, folder.cheminDaccesDossier.split('/').pop() || folder.cheminDaccesDossier)}>
                  <Image source={require('../assets/dossier.png')} style={styles.folderIconImage} />
                  <Text style={[styles.folderName, { color: theme.textColor }]}>{folder.cheminDaccesDossier.split('/').pop() || folder.cheminDaccesDossier}</Text>
                  <Text style={[styles.folderArrow, { color: theme.textColor }]}>›</Text>
                </TouchableOpacity>
              ))}
              {moveAvailableFolders.length === 0 && <Text style={[styles.emptyText, { color: theme.textColor, textAlign: 'center', marginTop: 20 }]}>Aucun sous-dossier</Text>}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowMoveModal(false)}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.primaryColor }]} onPress={confirmMove}>
                <Text style={styles.modalButtonText}>Déplacer ici</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de création de lien de partage */}
      <Modal visible={showShareModal} transparent animationType="slide" onRequestClose={() => {
        setShowShareModal(false);
        setShareEmail('');
        setSharePassword('');
        setShowDatePicker(false);
        setShareLink('');
      }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundColor }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>Partager "{itemToShare?.name}"</Text>
            
            {!shareLink ? (
              <>
                {/* Boutons de sélection du mode de partage */}
                <View style={styles.modeToggleContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.modeButton, 
                      shareMode === 'utilisateur' && { backgroundColor: theme.primaryColor }
                    ]} 
                    onPress={() => setShareMode('utilisateur')}
                  >
                    <Text style={[
                      styles.modeButtonText, 
                      shareMode === 'utilisateur' ? { color: '#fff' } : { color: theme.textColor }
                    ]}>
                      Utilisateur
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.modeButton, 
                      shareMode === 'invité' && { backgroundColor: theme.primaryColor }
                    ]} 
                    onPress={() => setShareMode('invité')}
                  >
                    <Text style={[
                      styles.modeButtonText, 
                      shareMode === 'invité' ? { color: '#fff' } : { color: theme.textColor }
                    ]}>
                      Lien invité
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Partage à un autre utilisateur */}
                {shareMode === 'utilisateur' ? (
                  <>
                    <Text style={[styles.modalDescription, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                      Entrez l'adresse email de l'utilisateur
                    </Text>
                    <TextInput 
                      style={[styles.modalInput, { 
                        backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7', 
                        color: theme.textColor 
                      }]} 
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
                  <>
                    {/* Partage à un invité */}
                    <Text style={[styles.modalDescription, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                      Créez un lien public avec mot de passe
                    </Text>
                    <TextInput 
                      style={[styles.modalInput, { 
                        backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7', 
                        color: theme.textColor 
                      }]} 
                      placeholder="Mot de passe" 
                      placeholderTextColor={theme.isDark ? '#8E8E93' : '#6C6C70'} 
                      value={sharePassword} 
                      onChangeText={setSharePassword} 
                      secureTextEntry 
                      autoFocus 
                    />
                    
                    <Text style={[styles.modalLabel, { color: theme.textColor, marginTop: 10, marginBottom: 8 }]}>
                      Date d'expiration
                    </Text>
                    <TouchableOpacity 
                      style={[styles.datePickerButton, { 
                        backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7',
                        marginBottom: 20
                      }]}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={[styles.datePickerText, { color: theme.textColor }]}>
                        {expiryDate.toLocaleDateString('fr-FR', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric' 
                        })}
                      </Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                      <>
                        <DateTimePicker
                          value={expiryDate}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={(event: any, selectedDate?: Date) => {
                            if (Platform.OS === 'android') {
                              setShowDatePicker(false);
                            }
                            if (selectedDate) {
                              setExpiryDate(selectedDate);
                            }
                          }}
                          minimumDate={new Date()}
                        />
                        {Platform.OS === 'ios' && (
                          <TouchableOpacity 
                            style={[styles.datePickerOkButton, { backgroundColor: theme.primaryColor }]}
                            onPress={() => setShowDatePicker(false)}
                          >
                            <Text style={styles.datePickerOkButtonText}>OK</Text>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <Text style={[styles.modalDescription, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
                  Lien de partage créé :
                </Text>
                <View style={[styles.linkContainer, { backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                  <Text style={[styles.linkText, { color: theme.primaryColor }]} numberOfLines={2}>
                    {shareLink}
                  </Text>
                </View>
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
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, { backgroundColor: theme.primaryColor }]} 
                    onPress={handleShare}
                  >
                    <Text style={styles.modalButtonText}>
                      {shareMode === 'utilisateur' ? 'Partager' : 'Créer le lien'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
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
                    <Text style={styles.cancelButtonText}>Fermer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, { backgroundColor: theme.primaryColor }]} 
                    onPress={copyShareLink}
                  >
                    <Text style={styles.modalButtonText}>Copier le lien</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal d'options */}
      <Modal visible={showOptionsModal} transparent animationType="fade" onRequestClose={() => setShowOptionsModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOptionsModal(false)}>
          <View style={[styles.optionsModalContent, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF' }]} onStartShouldSetResponder={() => true}>
            <View style={styles.optionsHeader}>
              <Text style={[styles.optionsTitle, { color: theme.textColor }]}>{selectedItem?.name}</Text>
            </View>
            <ScrollView style={styles.optionsList}>
              {selectedItem && (
                <>
                  {isInTrash ? (
                    <>
                      <TouchableOpacity style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]} onPress={() => handleOptionPress('restore')}>
                        <Image source={require('../assets/restaurer.png')} style={styles.optionIconImage} />
                        <Text style={[styles.optionText, { color: theme.textColor }]}>Restaurer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]} onPress={() => handleOptionPress('delete')}>
                        <Image source={require('../assets/corbeille.png')} style={styles.optionIconImage} />
                        <Text style={[styles.optionText, { color: '#FF3B30' }]}>Supprimer définitivement</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      {selectedItem.type === 'folder' ? (
                        <TouchableOpacity style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]} onPress={() => handleOptionPress('open')}>
                          <Image source={require('../assets/dossier.png')} style={styles.optionIconImage} />
                          <Text style={[styles.optionText, { color: theme.textColor }]}>Ouvrir</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]} onPress={() => handleOptionPress('download')}>
                          <Image source={require('../assets/telecharger.png')} style={styles.optionIconImage} />
                          <Text style={[styles.optionText, { color: theme.textColor }]}>Télécharger</Text>
                        </TouchableOpacity>
                      )}
                      {selectedItem.type === 'folder' && (
                        <TouchableOpacity style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]} onPress={() => handleOptionPress('zip')}>
                          <Image source={require('../assets/telecharger-zip.png')} style={styles.optionIconImage} />
                          <Text style={[styles.optionText, { color: theme.textColor }]}>Télécharger en ZIP</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]} onPress={() => handleOptionPress('rename')}>
                        <Image source={require('../assets/galerie.png')} style={styles.optionIconImage} />
                        <Text style={[styles.optionText, { color: theme.textColor }]}>Renommer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]} onPress={() => handleOptionPress('move')}>
                        <Image source={require('../assets/deplacer-le-fichier.png')} style={styles.optionIconImage} />
                        <Text style={[styles.optionText, { color: theme.textColor }]}>Déplacer</Text>
                      </TouchableOpacity>
                      {selectedItem.type === 'folder' && (
                        <TouchableOpacity style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]} onPress={() => handleOptionPress('share')}>
                          <Image source={require('../assets/lien.png')} style={styles.optionIconImage} />
                          <Text style={[styles.optionText, { color: theme.textColor }]}>Créer un lien de partage</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </>
              )}
            </ScrollView>
            <TouchableOpacity style={[styles.cancelOptionButton, { borderTopColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]} onPress={() => setShowOptionsModal(false)}>
              <Text style={[styles.cancelOptionText, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {fileToView && (
        <FileViewer visible={showFileViewer} fileUrl={fileToView.url} fileName={fileToView.name} onClose={() => { setShowFileViewer(false); setFileToView(null); }} />
      )}
    </View>
  );
}