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
    label: string;
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

    // Label par type de fichier
    const getFileTypeLabel = (type: string): string => {
    const map: Record<string, string> = {
        image: 'Images', pdf: 'PDF', document: 'Documents', 
        video: 'Vidéos', audio: 'Audios', archive: 'Archives', other: 'Autres'
    };
    return map[type] || 'Autres';
    };

    export function useDashboard(navigation: any) {
    const { user } = useAuth();
    
    const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
    const [fileTypeStats, setFileTypeStats] = useState<FileTypeStats[]>([]);
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    const MAX_STORAGE = 30 * 1024 * 1024 * 1024; // 30 GB

    // Fonctions de navigation
    const navigateToDocuments = () => navigation.navigate('Documents');
    const navigateToUpload = () => navigation.navigate('Upload');
    const navigateToShare = () => navigation.navigate('Share');

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
        setStorageStats(statsData.stockage);
        
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
        isLoadingStats,
        MAX_STORAGE,
        navigateToDocuments,
        navigateToUpload,
        navigateToShare,
        formatBytes,
        getBarColor,
    };
}