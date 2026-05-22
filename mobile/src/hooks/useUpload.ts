import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { dossierApi, Dossier } from '../api/api';
import { API_BASE_URL } from '../config';

export interface BreadcrumbItem {
    id: number | null;
    name: string;
}

export function useUpload(navigation: any) {
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
            // charger le contenu de user_X
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

    // génére un nom de fichier avec extension
    const generateFileName = (file: any, index: number): string => {
        let fileName = file.name;
        
        // Si pas de nom ou pas d'extension dans le nom
        if (!fileName || !fileName.includes('.')) {
        const extension = getExtensionFromMimeType(file.mimeType || file.type || '');
        
        if (fileName) {
            fileName = fileName + extension;
        } else {
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
        const token = await AsyncStorage.getItem('@supfile_token');
        if (!token) {
            Alert.alert('Erreur', 'Non authentifié');
            setUploading(false);
            return;
        }

        // Uploader chaque fichier individuellement
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const formData = new FormData();

            const fileName = generateFileName(file, i);
            const fileType = file.mimeType || file.type || 'application/octet-stream';

            // Construire l'objet fichier pour React Native
            formData.append('fichier', {
            uri: file.uri,
            name: fileName,
            type: fileType,
            } as any);

            // Mise à jour de la progression
            setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));

            const response = await fetch(`${API_BASE_URL}/api/dossiers/${selectedDossier.idDossier}/televerser`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
            });

            if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
            }
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
        Alert.alert('Erreur', error.message || 'Échec de l\'upload');
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

    return {
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
    };
}