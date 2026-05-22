import React from 'react';
import { 
    Image, 
    Video, 
    Music, 
    Archive, 
    FileText, 
    FileCode, 
    FileDigit, 
    File 
} from 'lucide-react';

export function obtenirEmojiFichier(nomFichier) {
    if (!nomFichier) return <File size={18} style={{ color: '#a0aec0', marginRight: '8px', verticalAlign: 'middle' }} />;

    const ext = nomFichier.split('.').pop().toLowerCase();
    const baseProps = { size: 18, style: { marginRight: '8px', verticalAlign: 'middle' } };

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
        return <Image {...baseProps} style={{ ...baseProps.style, color: '#10b981' }} />;
    }

    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
        return <Video {...baseProps} style={{ ...baseProps.style, color: '#f59e0b' }} />;
    }

    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) {
        return <Music {...baseProps} style={{ ...baseProps.style, color: '#8b5cf6' }} />;
    }

    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
        return <Archive {...baseProps} style={{ ...baseProps.style, color: '#d97706' }} />;
    }

    if (['pdf'].includes(ext)) {
        return <FileText {...baseProps} style={{ ...baseProps.style, color: '#ef4444' }} />;
    }

    if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) {
        return <FileText {...baseProps} style={{ ...baseProps.style, color: '#3b82f6' }} />;
    }

    if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) {
        return <FileDigit {...baseProps} style={{ ...baseProps.style, color: '#22c55e' }} />;
    }

    if (['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'php', 'py'].includes(ext)) {
        return <FileCode {...baseProps} style={{ ...baseProps.style, color: '#6366f1' }} />;
    }
    
    return <File {...baseProps} style={{ ...baseProps.style, color: '#6b7280' }} />;
}

export function formatFileSize(bytes) {
    if (bytes === 0) return '0 o';
    const k = 1024;
    const tailles = ['o', 'Ko', 'Mo', 'Go', 'To'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + tailles[i];
}

export function tronquerNom(nom, limite = 30) {
    if (!nom) return '';
    if (nom.length <= limite) return nom;
    return nom.substring(0, limite) + '...';
}

export function separerNomExtension(nomFichier) {
    if (!nomFichier) return { nomBase: '', extension: '' };
    const index = nomFichier.lastIndexOf('.');
    if (index === -1) return { nomBase: nomFichier, extension: '' };
    return {
        nomBase: nomFichier.substring(0, index),
        extension: nomFichier.substring(index + 1)
    };
}

export function obtenirTypeFichier(nomFichier) {
    if (!nomFichier) return 'autre';
    const ext = nomFichier.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return 'audio';
    if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'].includes(ext)) return 'document';
    return 'autre';
}