import { useState, useCallback, useEffect } from 'react';
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
    dossier?: Dossier;
    fichier?: Fichier;
    }

    export function useDocuments(navigation: any, route: any) {
    const { user } = useAuth();
    
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
    const [shareEmail, setShareEmail] = useState('');
    const [shareLink, setShareLink] = useState('');
    
    // État pour le menu d'options
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<DisplayItem | null>(null);
    
    // États pour le visualiseur de fichiers
    const [showFileViewer, setShowFileViewer] = useState(false);
    const [fileToView, setFileToView] = useState<{ url: string; name: string } | null>(null);

    useEffect(() => {
        const checkTargetFolder = async () => {
            const targetId = route?.params?.targetFolderId;
            
            if (targetId && targetId !== currentDossierId) {
                try {
                    // On récupère les infos du dossier pour avoir son vrai nom dans le fil d'Ariane
                    const dossier = await dossierApi.getDossierById(targetId);
                    const folderName = dossier.cheminDaccesDossier.split('/').pop() || 'Dossier';
                    
                    setCurrentDossierId(targetId);
                    setBreadcrumb([
                        { id: null, name: 'Mes Documents' }, 
                        { id: targetId, name: folderName }
                    ]);

                    // On efface le paramètre pour ne pas rester bloqué sur ce dossier
                    // si l'utilisateur navigue ailleurs puis revient
                    navigation.setParams({ targetFolderId: undefined });
                } catch (error) {
                    console.error("Erreur lors de la récupération du dossier cible:", error);
                    // Fallback de sécurité
                    setCurrentDossierId(targetId);
                }
            }
        };

        checkTargetFolder();
    }, [route?.params?.targetFolderId]);

    // Fonction pour charger le contenu du dossier actuel
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
                    // Si la corbeille n'existe pas, check dans dossiersRacine
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

        // Trier les dossiers en premier puis les fichiers par ordre alphabétique
        setItems(displayItems);
        } catch (error: any) {
        console.error('Erreur chargement:', error);
        Alert.alert('Erreur', 'Impossible de charger les documents');
        } finally {
        setIsLoading(false);
        }
    };

    // Charger le contenu à l'ouverture de l'écran et à chaque changement de dossier
    useFocusEffect(
        useCallback(() => {
        loadContent();
        }, [currentDossierId])
    );

    // Fonction pour extraire le nom de fichier depuis le chemin d'accès
    const navigateToFolder = (dossier: Dossier) => {
        const folderName = dossier.cheminDaccesDossier.split('/').pop() || dossier.cheminDaccesDossier;
        setBreadcrumb([...breadcrumb, { id: dossier.idDossier, name: folderName }]);
        setCurrentDossierId(dossier.idDossier);
    };

    // Fonction pour extraire le nom de fichier depuis le chemin d'accès
    const navigateToTrash = async () => {
        if (!corbeilleId) {
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

    // Fonction pour naviguer dans le breadcrumb
    const navigateToLevel = (index: number) => {
        const newBreadcrumb = breadcrumb.slice(0, index + 1);
        setBreadcrumb(newBreadcrumb);
        setCurrentDossierId(newBreadcrumb[newBreadcrumb.length - 1].id);
    };

    // Fonction pour créer un nouveau dossier
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

    // Fonction pour afficher un fichier
    const handleFilePress = async (item: DisplayItem) => {
        if (!item.fichier) return;
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

    // Fonction pour extraire le nom de fichier depuis le chemin d'accès
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

        const downloadResult = await FileSystem.downloadAsync(fileUrl, fileUri, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

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

    // Fonction pour extraire le nom de fichier depuis le chemin d'accès
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

    // Fonction pour restaurer un élément depuis la corbeille
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

    // Fonction pour supprimer définitivement un élément
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

    // Fonction pour extraire le nom de fichier depuis le chemin d'accès
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

        const downloadResult = await FileSystem.downloadAsync(zipUrl, zipUri, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (downloadResult.status === 200) {
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

    // Fonction pour ouvrir le modal de déplacement
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

    // Fonction pour naviguer dans le modal de déplacement
    const navigateInMoveModal = async (folderId: number | null, folderName: string) => {
        setMoveDestination(folderId || userRootFolderId);
        
        if (folderId) {
        const newBreadcrumb = [...moveBreadcrumb, { id: folderId, name: folderName }];
        // Mettre à jour le breadcrumb et charger les dossiers disponibles pour le déplacement
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
            // retour à la racine
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

    // Fonction pour confirmer le déplacement
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
    
    // Fonction pour ouvrir le modal de partage
    const openShareModal = (item: DisplayItem) => {
        setItemToShare(item);
        setShareEmail('');
        setShareLink('');
        setShowShareModal(true);
    };

    // Fonction pour créer un lien de partage
    const createShareLink = async () => {
        if (!itemToShare || !shareEmail.trim()) {
        Alert.alert('Erreur', 'Veuillez entrer une adresse email');
        return;
        }
        try {
        const dossierId = itemToShare.type === 'folder' 
            ? itemToShare.dossier?.idDossier 
            : currentDossierId || userRootFolderId;
        
        if (!dossierId) {
            Alert.alert('Erreur', 'Impossible de déterminer le dossier');
            return;
        }
        const data: any = { email: shareEmail };
        if (itemToShare.type === 'file' && itemToShare.fichier) {
            data.fileName = itemToShare.fichier.nom;
        }
        const response = await lienApi.createShareLink(dossierId, data);
        
        if ((response as any).data?.lien?.url) {
            const fullLink = `${API_BASE_URL}${(response as any).data.lien.url}`;
            setShareLink(fullLink);
            await Clipboard.setStringAsync(fullLink);
            Alert.alert('Succès', 'Lien créé et copié dans le presse-papier !');
        }
        } catch (error: any) {
        Alert.alert('Erreur', error.response?.data?.error || 'Impossible de créer le lien');
        }
    };

    // Fonction pour copier le lien de partage dans le presse-papier
    const copyShareLink = async () => {
        if (shareLink) {
        await Clipboard.setStringAsync(shareLink);
        Alert.alert('Succès', 'Lien copié dans le presse-papier');
        }
    };

    // Fonction pour afficher les options d'un élément (ouvrir, télécharger, déplacer, partager, etc.)
    const showItemOptions = (item: DisplayItem) => {
        setSelectedItem(item);
        setShowOptionsModal(true);
    };

    // Fonction pour gérer l'action sélectionnée dans le menu d'options
    const handleOptionPress = async (action: string) => {
        setShowOptionsModal(false);
        if (!selectedItem) return;

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

    // Fonction pour vider la corbeille
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

    // Fonction pour formater la taille des fichiers de manière lisible
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
        handleMoveToTrash,
        handleEmptyTrash,
        navigateInMoveModal,
        confirmMove,
        createShareLink,
        copyShareLink,
        showItemOptions,
        handleOptionPress,
        formatFileSize,
    };
}