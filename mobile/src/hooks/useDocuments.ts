import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { dossierApi, lienApi, Dossier, Fichier } from '../api/api';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

export interface BreadcrumbItem {
    id: number | null;
    name: string;
}

export interface DisplayItem {
    id: string;
    name: string;
    type: 'folder' | 'file';
    size?: number;
    date?: string;
    dossier?: Dossier;
    fichier?: Fichier;
}

export function useDocuments(navigation: any) {
    const { user } = useAuth();
    
    const [items, setItems] = useState<DisplayItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([{ id: null, name: '' }]);
    const [currentDossierId, setCurrentDossierId] = useState<number | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isInTrash, setIsInTrash] = useState(false);
    const [trashSize, setTrashSize] = useState(0);

    const [showMoveModal, setShowMoveModal] = useState(false);
    const [itemToMove, setItemToMove] = useState<DisplayItem | null>(null);
    const [moveBreadcrumb, setMoveBreadcrumb] = useState<BreadcrumbItem[]>([{ id: null, name: 'Racine' }]);
    const [moveAvailableFolders, setMoveAvailableFolders] = useState<Dossier[]>([]);

    const [showShareModal, setShowShareModal] = useState(false);
    const [itemToShare, setItemToShare] = useState<DisplayItem | null>(null);
    const [shareEmail, setShareEmail] = useState('');
    const [shareLink, setShareLink] = useState('');

    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<DisplayItem | null>(null);

    const [showFileViewer, setShowFileViewer] = useState(false);
    const [fileToView, setFileToView] = useState<{ url: string; name: string } | null>(null);

    const loadContent = useCallback(async () => {
        setIsLoading(true);
        try {
            if (isInTrash) {
                const response = await dossierApi.getCorbeille();
                const dossiers = response.data.dossiers || [];
                const fichiers = response.data.fichiers || [];

                const mappedDossiers = dossiers.map((d: Dossier) => ({
                    id: `folder-${d.idDossier}`,
                    name: d.cheminDaccesDossier,
                    type: 'folder' as const,
                    date: d.modifieLe || d.dateCreation,
                    dossier: d
                }));

                const mappedFichiers = fichiers.map((f: Fichier) => ({
                    id: `file-${f.idFichier || f.nom}`,
                    name: f.nom,
                    type: 'file' as const,
                    size: f.taille,
                    date: f.dateModification || f.dateCreation,
                    fichier: f
                }));

                setItems([...mappedDossiers, ...mappedFichiers]);
                
                let size = 0;
                mappedFichiers.forEach((f: any) => { size += f.size || 0; });
                setTrashSize(size);
            } else {
                const response = currentDossierId 
                    ? await dossierApi.getContenuDossier(currentDossierId)
                    : await dossierApi.getDossiersBase(user!.idCompte);

                const dossiers = response.data.dossiers || [];
                const fichiers = response.data.fichiers || [];

                const mappedDossiers = dossiers.map((d: Dossier) => ({
                    id: `folder-${d.idDossier}`,
                    name: d.cheminDaccesDossier,
                    type: 'folder' as const,
                    date: d.modifieLe || d.dateCreation,
                    dossier: d
                }));

                const mappedFichiers = fichiers.map((f: Fichier) => ({
                    id: `file-${f.idFichier || f.nom}`,
                    name: f.nom,
                    type: 'file' as const,
                    size: f.taille,
                    date: f.dateModification || f.dateCreation,
                    fichier: f
                }));

                setItems([...mappedDossiers, ...mappedFichiers]);
            }
        } catch (error) {
            console.error('Erreur chargement documents:', error);
            Alert.alert('Erreur', 'Impossible de charger le contenu.');
        } finally {
            setIsLoading(false);
        }
    }, [currentDossierId, isInTrash, user]);

    useFocusEffect(
        useCallback(() => {
            loadContent();
        }, [loadContent])
    );

    const navigateToFolder = (folderId: number | null, folderName: string) => {
        setIsInTrash(false);
        setCurrentDossierId(folderId);
        if (folderId === null) {
            setBreadcrumb([{ id: null, name: '' }]);
        } else {
            setBreadcrumb([...breadcrumb, { id: folderId, name: folderName }]);
        }
    };

    const navigateToTrash = () => {
        setIsInTrash(true);
        setCurrentDossierId(null);
        setBreadcrumb([{ id: null, name: 'Corbeille' }]);
    };

    const navigateToLevel = (index: number) => {
        const item = breadcrumb[index];
        if (item.name === 'Corbeille') {
            navigateToTrash();
        } else {
            setCurrentDossierId(item.id);
            setBreadcrumb(breadcrumb.slice(0, index + 1));
            setIsInTrash(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            await dossierApi.creerDossier({
                nomDossier: newFolderName,
                idDossierParent: currentDossierId,
                idCompte: user!.idCompte
            });
            setNewFolderName('');
            setShowCreateModal(false);
            loadContent();
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de créer le dossier.');
        }
    };

    const handleFilePress = async (item: DisplayItem) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const url = `${API_BASE_URL}/api/dossiers/${currentDossierId || 'racine'}/fichiers/${encodeURIComponent(item.name)}/apercu?token=${token}`;
            setFileToView({ url, name: item.name });
            setShowFileViewer(true);
        } catch (error) {
            Alert.alert('Erreur', "Impossible d'ouvrir le fichier.");
        }
    };

    const handleDownloadItem = async (item: DisplayItem) => {
        try {
            const token = await AsyncStorage.getItem('token');
            let url = '';
            if (item.type === 'folder') {
                const nom_racine = `user_${user!.idCompte}`;
                const sous_dossiers = breadcrumb.filter(b => b.id !== null).map(b => b.name).join('/');
                const chemin_actuel = sous_dossiers ? `${nom_racine}/${sous_dossiers}` : nom_racine;
                const liste_dossier = [`${chemin_actuel}/${item.name}`];
                url = `${API_BASE_URL}/api/telechargerZip?listeDossier=${JSON.stringify(liste_dossier)}`;
            } else {
                url = `${API_BASE_URL}/api/dossiers/${currentDossierId || 'racine'}/fichiers/${encodeURIComponent(item.name)}?download=true`;
            }

            const localUri = `${FileSystem.documentDirectory}${item.name}${item.type === 'folder' ? '.zip' : ''}`;
            
            Alert.alert('Téléchargement', 'Le téléchargement a démarré...');
            const { uri } = await FileSystem.downloadAsync(url, localUri, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                Alert.alert('Succès', 'Fichier téléchargé avec succès localement.');
            }
        } catch (error) {
            Alert.alert('Erreur', 'Échec du téléchargement.');
        }
    };

    const handleMovePress = async (item: DisplayItem) => {
        setItemToMove(item);
        setMoveBreadcrumb([{ id: null, name: 'Racine' }]);
        setShowMoveModal(true);
        loadMoveFolders(null);
    };

    const loadMoveFolders = async (folderId: number | null) => {
        try {
            const response = folderId 
                ? await dossierApi.getContenuDossier(folderId)
                : await dossierApi.getDossiersBase(user!.idCompte);
            
            const dirs = response.data.dossiers || [];
            setMoveAvailableFolders(dirs.filter((d: Dossier) => `folder-${d.idDossier}` !== itemToMove?.id));
        } catch (error) {
            console.error(error);
        }
    };

    const navigateMoveLevel = (folderId: number | null, folderName: string) => {
        if (folderId === null) {
            setMoveBreadcrumb([{ id: null, name: 'Racine' }]);
        } else {
            setMoveBreadcrumb([...moveBreadcrumb, { id: folderId, name: folderName }]);
        }
        loadMoveFolders(folderId);
    };

    const handleConfirmMove = async () => {
        if (!itemToMove) return;
        const targetFolderId = moveBreadcrumb[moveBreadcrumb.length - 1].id;
        try {
            if (itemToMove.type === 'folder') {
                await dossierApi.deplacerDossier(itemToMove.dossier!.idDossier, targetFolderId);
            } else {
                await dossierApi.deplacerFichier(currentDossierId, targetFolderId, itemToMove.name);
            }
            setShowMoveModal(false);
            setItemToMove(null);
            loadContent();
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de déplacer l’élément.');
        }
    };

    const handleSharePress = (item: DisplayItem) => {
        setItemToShare(item);
        setShareEmail('');
        setShareLink('');
        setShowShareModal(true);
    };

    const handleCreateShareLink = async () => {
        if (!itemToShare) return;
        try {
            const payload = itemToShare.type === 'folder' 
                ? { idDossier: itemToShare.dossier!.idDossier, type: 'dossier' }
                : { idDossier: currentDossierId, nomFichier: itemToShare.name, type: 'fichier' };
            
            const response = await lienApi.creerLienPublic(payload);
            setShareLink(`${API_BASE_URL}${response.data.url}`);
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de générer le lien.');
        }
    };

    const handleCopyLink = async () => {
        await Clipboard.setStringAsync(shareLink);
        Alert.alert('Succès', 'Lien copié dans le presse-papier.');
    };

    const handleSendEmailShare = async () => {
        if (!itemToShare || !shareEmail.trim()) return;
        try {
            await dossierApi.partagerRessource({
                idDossier: itemToShare.type === 'folder' ? itemToShare.dossier!.idDossier : undefined,
                idDossierParent: itemToShare.type === 'file' ? currentDossierId : undefined,
                nomFichier: itemToShare.type === 'file' ? itemToShare.name : undefined,
                emailContact: shareEmail
            });
            Alert.alert('Succès', 'Partage envoyé avec succès.');
            setShareEmail('');
        } catch (error) {
            Alert.alert('Erreur', 'Échec du partage par email.');
        }
    };

    const handleRenamePress = (item: DisplayItem) => {
        setSelectedItem(item);
        setNewFolderName(item.name);
        setShowCreateModal(true);
    };

    const handleConfirmRename = async () => {
        if (!selectedItem || !newFolderName.trim()) return;
        try {
            if (selectedItem.type === 'folder') {
                await dossierApi.renommerDossier(selectedItem.dossier!.idDossier, newFolderName);
            } else {
                await dossierApi.renommerFichier(currentDossierId, selectedItem.name, newFolderName);
            }
            setNewFolderName('');
            setSelectedItem(null);
            setShowCreateModal(false);
            loadContent();
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de renommer l’élément.');
        }
    };

    const handleDeleteItem = async (item: DisplayItem) => {
        try {
            if (isInTrash) {
                Alert.alert('Suppression Définitive', 'Voulez-vous supprimer définitivement cet élément ?', [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Supprimer', style: 'destructive', onPress: async () => {
                        if (item.type === 'folder') {
                            await dossierApi.supprimerDossierDefinitif(item.dossier!.idDossier);
                        } else {
                            await dossierApi.supprimerFichierDefinitif(item.fichier!.idDossier, item.name);
                        }
                        loadContent();
                    }}
                ]);
            } else {
                if (item.type === 'folder') {
                    await dossierApi.supprimerDossierVersCorbeille(item.dossier!.idDossier);
                } else {
                    await dossierApi.supprimerFichierVersCorbeille(currentDossierId, item.name);
                }
                loadContent();
            }
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de supprimer l’élément.');
        }
    };

    const handleRestoreItem = async (item: DisplayItem) => {
        try {
            if (item.type === 'folder') {
                await dossierApi.restaurerDossier(item.dossier!.idDossier);
            } else {
                await dossierApi.restaurerFichier(item.name);
            }
            loadContent();
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de restaurer l’élément.');
        }
    };

    const handleViderCorbeille = async () => {
        Alert.alert('Vider la corbeille', 'Voulez-vous supprimer définitivement tous les éléments de la corbeille ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Vider', style: 'destructive', onPress: async () => {
                try {
                    await dossierApi.viderCorbeille();
                    loadContent();
                } catch (error) {
                    Alert.alert('Erreur', 'Impossible de vider la corbeille.');
                }
            }}
        ]);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return {
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
        setFileToView,
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
    };
}