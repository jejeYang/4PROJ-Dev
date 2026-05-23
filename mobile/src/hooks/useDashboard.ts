import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

export interface StorageStats {
    utilise: number;
    total: number;
}

export interface FileTypeStats {
    type: string;
    count: number;
    emoji: string;
    icon: any;
    label: string;
}

export interface DernierDossier {
    idDossier: number;
    nom: string;
    mtime: number;
}

export interface DernierFichier {
    nom: string;
    taille: number;
    atime: number;
    idDossierParent: number;
}

// Récupère type fichier
const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx', 'txt', 'rtf', 'odt', 'csv', 'xls', 'xlsx'].includes(ext)) return 'document';
    if (['mp4', 'avi', 'mov', 'mkv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio';
    if (['zip', 'rar', '7z', 'tar'].includes(ext)) return 'archive';
    return 'other';
};

// Icone par type de fichier
const getFileTypeEmoji = (type: string): string => {
    const map: Record<string, string> = {
        image: '🖼️', pdf: '📕', document: '📄',
        video: '🎥', audio: '🎵', archive: '📦', other: '📁'
    };
    return map[type] || '📁';
};

// Image par type de fichier
const getFileTypeIcon = (type: string): any => {
    const map: Record<string, any> = {
        image: require('../assets/image.png'),
        pdf: require('../assets/docs.png'),
        document: require('../assets/docs.png'),
        video: require('../assets/referencement-video.png'),
        audio: require('../assets/fichier-audio.png'),
        archive: require('../assets/archive.png'),
        other: require('../assets/docs.png')
    };
    return map[type] || require('../assets/docs.png');
};

// Label par type de fichier
const getFileTypeLabel = (type: string): string => {
    const map: Record<string, string> = {
        image: 'Images', pdf: 'PDF', document: 'Documents',
        video: 'Vidéos', audio: 'Audios', archive: 'Archives', other: 'Autres'
    };
    return map[type] || 'Autres';
};

export function obtenirEmojiFichier(nom: string): string {
    const ext = nom.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return '🖼️';
    if (['pdf'].includes(ext)) return '📕';
    if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) return '📝';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
    if (['ppt', 'pptx'].includes(ext)) return '📊';
    if (['txt'].includes(ext)) return '📄';
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return '🎥';
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return '🎵';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '📦';
    return '📄';
}

export function obtenirIconeFichier(nom: string): any {
    const ext = nom.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return require('../assets/image.png');
    if (['pdf'].includes(ext)) return require('../assets/docs.png');
    if (['doc', 'docx', 'odt', 'rtf', 'txt'].includes(ext)) return require('../assets/docs.png');
    if (['xls', 'xlsx', 'csv', 'ppt', 'pptx'].includes(ext)) return require('../assets/diagramme-circulaire.png');
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return require('../assets/referencement-video.png');
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return require('../assets/fichier-audio.png');
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return require('../assets/archive.png');
    return require('../assets/docs.png');
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 o';
    const k = 1024;
    const sizes = ['o', 'Ko', 'Mo', 'Go'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function useDashboard(navigation: any) {
    const { user } = useAuth();

    const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
    const [fileTypeStats, setFileTypeStats] = useState<FileTypeStats[]>([]);
    const [derniersDossiers, setDerniersDossiers] = useState<DernierDossier[]>([]);
    const [derniersFichiers, setDerniersFichiers] = useState<DernierFichier[]>([]);
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    const MAX_STORAGE = 30 * 1024 * 1024 * 1024; // 30 GB

    // Fonctions de navigation
    const navigateToDocuments = () => navigation.navigate('Documents');
    const navigateToUpload = () => navigation.navigate('Upload');
    const navigateToShare = () => navigation.navigate('Share');
    const navigateToDossier = (dossierId: number | null) => {
    if (dossierId) {
        // Envoie vers l'écran Documents en passant l'ID du dossier cible
        navigation.navigate('Documents', { targetFolderId: dossierId });
    } else {
        navigation.navigate('Documents');
    }
};

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 octets';
        const k = 1024;
        const sizes = ['octets', 'Ko', 'Mo', 'Go', 'To'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const getBarColor = (index: number): string => {
        const colors = ['#06BCC1', '#474973', '#4ae61f', '#6a166f', '#f48d25', '#FF6B6B', '#4ECDC4'];
        return colors[index % colors.length];
    };

    const fetchStorageStats = useCallback(async () => {
        try {
            setIsLoadingStats(true);
            const response: any = await apiClient.get('/api/dossiers/stats/home');

            const statsData = response.data || response;
            
            // Vérifie que les données de stockage sont valides
            const stockageData = statsData.stockage || {};
            const stockageUtilise = typeof stockageData.utilise === 'number' && !isNaN(stockageData.utilise) 
                ? stockageData.utilise 
                : 0;
            const stockageTotal = typeof stockageData.total === 'number' && !isNaN(stockageData.total) 
                ? stockageData.total 
                : MAX_STORAGE;
            
            setStorageStats({
                utilise: stockageUtilise,
                total: stockageTotal
            });
            
            setDerniersDossiers(statsData.derniersDossiers || []);
            setDerniersFichiers(statsData.derniersFichiers || []);

            const typeCounts: { [key: string]: number } = {};
            if (statsData.tousLesFichiers) {
                statsData.tousLesFichiers.forEach((fileName: string) => {
                    const type = getFileType(fileName);
                    typeCounts[type] = (typeCounts[type] || 0) + 1;
                });
            }

            const fileTypes = Object.keys(typeCounts)
                .map(type => ({
                    type,
                    count: typeCounts[type],
                    emoji: getFileTypeEmoji(type),
                    icon: getFileTypeIcon(type),
                    label: getFileTypeLabel(type)
                }))
                .sort((a, b) => b.count - a.count);

            setFileTypeStats(fileTypes);
        } catch (error) {
            console.error('Erreur lors de la récupération des stats:', error);
        } finally {
            setIsLoadingStats(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchStorageStats();
        }, [fetchStorageStats])
    );

    return {
        user,
        storageStats,
        fileTypeStats,
        derniersDossiers,
        derniersFichiers,
        isLoadingStats,
        MAX_STORAGE,
        navigateToDocuments,
        navigateToUpload,
        navigateToShare,
        navigateToDossier,
        formatBytes,
        getBarColor,
    };
}