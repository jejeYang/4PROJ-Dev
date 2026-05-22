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
} from 'react-native';
import { useMobileTheme } from '../context/MobileThemeContext';
import FileViewer from '../components/FileViewer';
import { useDocuments, DisplayItem } from '../hooks/useDocuments';
import { styles } from '../styles/DocumentsScreen.styles';

export default function DocumentsScreen({ navigation }: any) {
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
    shareEmail,
    setShareEmail,
    shareLink,
    showOptionsModal,
    setShowOptionsModal,
    selectedItem,
    showFileViewer,
    setShowFileViewer,
    fileToView,
    loadContent,
    navigateToFolder,
    navigateToTrash,
    navigateToLevel,
    handleCreateFolder,
    handleFilePress,
    handleDownloadItem,
    handleMovePress,
    navigateMoveLevel,
    handleConfirmMove,
    handleSharePress,
    handleCreateShareLink,
    handleCopyLink,
    handleSendEmailShare,
    handleRenamePress,
    handleConfirmRename,
    handleDeleteItem,
    handleRestoreItem,
    handleViderCorbeille,
    formatFileSize
  } = useDocuments(navigation);

  const formaterDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleItemPress = (item: DisplayItem) => {
    if (item.type === 'folder') {
      navigateToFolder(item.dossier!.idDossier, item.dossier!.cheminDaccesDossier);
    } else {
      handleFilePress(item);
    }
  };

  const handleMorePress = (item: DisplayItem) => {
    setSelectedItem(item);
    setShowOptionsModal(true);
  };

  const handleOptionPress = (action: string) => {
    setShowOptionsModal(false);
    if (!selectedItem) return;

    switch (action) {
      case 'download':
        handleDownloadItem(selectedItem);
        break;
      case 'move':
        handleMovePress(selectedItem);
        break;
      case 'share':
        handleSharePress(selectedItem);
        break;
      case 'rename':
        handleRenamePress(selectedItem);
        break;
      case 'delete':
        handleDeleteItem(selectedItem);
        break;
      case 'restore':
        handleRestoreItem(selectedItem);
        break;
    }
  };

  const renderItem = ({ item }: { item: DisplayItem }) => {
    const isFolder = item.type === 'folder';
    const iconSource = isFolder
      ? require('../assets/dossier.png')
      : require('../assets/fichier-de-documents.png');

    return (
      <View style={[styles.itemContainer, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]}>
        <TouchableOpacity style={styles.itemTextContainer} onPress={() => handleItemPress(item)} flexDirection="row" alignItems="center">
          <Image source={iconSource} style={styles.itemIcon} />
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={[styles.itemText, { color: theme.textColor }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.itemMetaRow}>
              {item.date ? (
                <Text style={[styles.itemDateText, { color: theme.textColor }]}>
                  {formaterDate(item.date)}
                </Text>
              ) : null}
              {!isFolder && item.size ? (
                <>
                  <Text style={[styles.metaSeparator, { color: theme.textColor }]}>•</Text>
                  <Text style={[styles.itemSizeText, { color: theme.textColor }]}>
                    {formatFileSize(item.size)}
                  </Text>
                </>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionsButton} onPress={() => handleMorePress(item)}>
          <Image source={require('../assets/plus.png')} style={[styles.optionsIcon, { tintColor: theme.textColor }]} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <View style={[styles.breadcrumb, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.breadcrumbItem}>
          <TouchableOpacity onPress={() => navigateToLevel(-1)}>
            <Text style={[styles.breadcrumbText, { color: theme.primaryColor }]}>Espace Client</Text>
          </TouchableOpacity>
          {breadcrumb.map((b, index) => (
            <React.Fragment key={index}>
              {b.name !== '' && <Text style={[styles.breadcrumbSeparator, { color: theme.textColor }]}> › </Text>}
              <TouchableOpacity disabled={index === breadcrumb.length - 1} onPress={() => navigateToLevel(index)}>
                <Text style={[styles.breadcrumbText, { color: index === breadcrumb.length - 1 ? theme.textColor : theme.primaryColor }]}>
                  {b.name}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </ScrollView>
      </View>

      {!isInTrash && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.primaryColor }]} onPress={() => setShowCreateModal(true)}>
            <View style={styles.actionButtonContent}>
              <Image source={require('../assets/ajouter-le-dossier.png')} style={[styles.actionButtonIcon, { tintColor: '#FFF' }]} />
              <Text style={[styles.actionButtonText, { color: '#FFF' }]}>Nouveau Dossier</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.isDark ? '#1C1C1E' : '#F2F2F7', borderWidth: 1, borderColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]} onPress={navigateToTrash}>
            <View style={styles.actionButtonContent}>
              <Image source={require('../assets/poubelle.png')} style={[styles.actionButtonIcon, { tintColor: theme.primaryColor }]} />
              <Text style={[styles.actionButtonText, { color: theme.primaryColor }]}>Corbeille</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {isInTrash && (
        <View style={styles.actionBar}>
          <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 4 }}>
            <Text style={{ color: theme.textColor, fontSize: 14 }}>Taille totale : {formatFileSize(trashSize)}</Text>
          </View>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#FF3B30', maxwidth: 140, height: 38 }]} onPress={handleViderCorbeille}>
            <Text style={[styles.actionButtonText, { color: '#FFF' }]}>Vider</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={{ color: theme.textColor, marginTop: 40, fontSize: 15 }}>Ce dossier est vide.</Text>
            </View>
          }
        />
      )}

      {/* MODALE : CRÉATION DOSSIER */}
      <Modal visible={showCreateModal && !selectedItem} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCreateModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFF' }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>Nouveau dossier</Text>
            <TextInput
              style={[styles.input, { color: theme.textColor, backgroundColor: theme.isDark ? '#2C2C2E' : '#FFF', borderColor: theme.isDark ? '#3A3A3C' : '#E5E5EA' }]}
              placeholder="Nom du dossier"
              placeholderTextColor="#8E8E93"
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7' }]} onPress={() => setShowCreateModal(false)}>
                <Text style={[styles.modalButtonText, { color: theme.textColor }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.primaryColor }]} onPress={handleCreateFolder}>
                <Text style={[styles.modalButtonText, { color: '#FFF' }]}>Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODALE : RENOMMER ÉLÉMENT */}
      <Modal visible={showCreateModal && selectedItem !== null} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { setShowCreateModal(false); setSelectedItem(null); }}>
          <View style={[styles.modalContent, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFF' }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>Renommer l'élément</Text>
            <TextInput
              style={[styles.input, { color: theme.textColor, backgroundColor: theme.isDark ? '#2C2C2E' : '#FFF', borderColor: theme.isDark ? '#3A3A3C' : '#E5E5EA' }]}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7' }]} onPress={() => { setShowCreateModal(false); setSelectedItem(null); }}>
                <Text style={[styles.modalButtonText, { color: theme.textColor }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.primaryColor }]} onPress={handleConfirmRename}>
                <Text style={[styles.modalButtonText, { color: '#FFF' }]}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showMoveModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFF', width: '100%', height: '80%', borderBottomRadius: 0 }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>Déplacer vers...</Text>
            <View style={{ width: '100%', padding: 8, backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7', borderRadius: 8, flexDirection: 'row' }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.breadcrumbItem}>
                {moveBreadcrumb.map((b, idx) => (
                  <TouchableOpacity key={idx} onPress={() => navigateMoveLevel(b.id, b.name)}>
                    <Text style={{ color: theme.primaryColor }}>{b.name} {idx < moveBreadcrumb.length - 1 ? '› ' : ''}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <ScrollView style={{ width: '100%', marginTop: 10 }}>
              {moveAvailableFolders.map((f) => (
                <TouchableOpacity key={f.idDossier} style={[styles.moveFolderItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]} onPress={() => navigateMoveLevel(f.idDossier, f.cheminDaccesDossier)}>
                  <View style={styles.moveFolderLeft}>
                    <Image source={require('../assets/dossier.png')} style={styles.moveFolderIcon} />
                    <Text style={[styles.moveFolderName, { color: theme.textColor }]}>{f.cheminDaccesDossier}</Text>
                  </View>
                  <Text style={[styles.folderArrow, { color: theme.textColor }]}>›</Text>
                </TouchableOpacity>
              ))}
              {moveAvailableFolders.length === 0 && (
                <Text style={{ textAlign: 'center', color: '#8E8E93', marginTop: 20 }}>Aucun sous-dossier disponible</Text>
              )}
            </ScrollView>
            <View style={[styles.modalButtons, { marginTop: 15 }]}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7' }]} onPress={() => setShowMoveModal(false)}>
                <Text style={[styles.modalButtonText, { color: theme.textColor }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.primaryColor }]} onPress={handleConfirmMove}>
                <Text style={[styles.modalButtonText, { color: '#FFF' }]}>Déplacer ici</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showShareModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowShareModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFF' }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>Partager l'élément</Text>
            
            <Text style={[styles.modalDescription, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>Générer un lien public ou envoyer par email.</Text>
            
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.primaryColor, width: '100%', marginBottom: 15 }]} onPress={handleCreateShareLink}>
              <Text style={{ color: '#FFF', fontWeight: '600' }}>Générer un lien d'accès invité</Text>
            </TouchableOpacity>

            {shareLink !== '' && (
              <TouchableOpacity style={[styles.linkContainer, { backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7' }]} onPress={handleCopyLink}>
                <Text style={[styles.linkText, { color: theme.primaryColor }]} numberOfLines={1}>{shareLink}</Text>
                <Text style={{ fontSize: 11, color: '#8E8E93', textAlign: 'center', marginTop: 4 }}>Cliquez pour copier</Text>
              </TouchableOpacity>
            )}

            <TextInput
              style={[styles.input, { color: theme.textColor, backgroundColor: theme.isDark ? '#2C2C2E' : '#FFF', borderColor: theme.isDark ? '#3A3A3C' : '#E5E5EA', marginTop: 10 }]}
              placeholder="Adresse email du destinataire"
              placeholderTextColor="#8E8E93"
              value={shareEmail}
              onChangeText={setShareEmail}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7' }]} onPress={() => setShowShareModal(false)}>
                <Text style={[styles.modalButtonText, { color: theme.textColor }]}>Fermer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.primaryColor }]} disabled={shareEmail.trim() === ''} onPress={handleSendEmailShare}>
                <Text style={[styles.modalButtonText, { color: '#FFF' }]}>Envoyer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showOptionsModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOptionsModal(false)}>
          <View style={[styles.optionsModalContent, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFF' }]}>
            <View style={[styles.optionsHeader, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]}>
              <Text style={[styles.optionsTitle, { color: theme.textColor }]} numberOfLines={1}>{selectedItem?.name}</Text>
            </View>
            <ScrollView style={styles.optionsList}>
              {selectedItem && (
                <>
                  {isInTrash ? (
                    <>
                      <TouchableOpacity style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]} onPress={() => handleOptionPress('restore')}>
                        <Image source={require('../assets/restaurer.png')} style={styles.optionIconImage} />
                        <Text style={[styles.optionText, { color: theme.textColor }]}>Restaurer l'élément</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]} onPress={() => handleOptionPress('delete')}>
                        <Image source={require('../assets/poubelle.png')} style={styles.optionIconImage} />
                        <Text style={[styles.optionText, { color: '#FF3B30' }]}>Supprimer définitivement</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]} onPress={() => handleOptionPress('download')}>
                        <Image source={require('../assets/telecharger.png')} style={styles.optionIconImage} />
                        <Text style={[styles.optionText, { color: theme.textColor }]}>Télécharger</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]} onPress={() => handleOptionPress('rename')}>
                        <Image source={require('../assets/modifier.png')} style={styles.optionIconImage} />
                        <Text style={[styles.optionText, { color: theme.textColor }]}>Renommer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]} onPress={() => handleOptionPress('delete')}>
                        <Image source={require('../assets/poubelle.png')} style={styles.optionIconImage} />
                        <Text style={[styles.optionText, { color: '#FF3B30' }]}>Mettre à la corbeille</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]} onPress={() => handleOptionPress('move')}>
                        <Image source={require('../assets/deplacer-le-fichier.png')} style={styles.optionIconImage} />
                        <Text style={[styles.optionText, { color: theme.textColor }]}>Déplacer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.optionItem, { borderBottomColor: theme.isDark ? '#2C2C2E' : '#E5E5EA' }]} onPress={() => handleOptionPress('share')}>
                        <Image source={require('../assets/lien.png')} style={styles.optionIconImage} />
                        <Text style={[styles.optionText, { color: theme.textColor }]}>Créer un lien de partage</Text>
                      </TouchableOpacity>
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