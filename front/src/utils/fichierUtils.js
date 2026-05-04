export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 o';
    const k = 1024;
    const tailles = ['o', 'Ko', 'Mo', 'Go'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), tailles.length - 1);
    const tailleCalculee = bytes / Math.pow(k, i);
    const formateur = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
    return `${formateur.format(tailleCalculee)} ${tailles[i]}`;
};

export const obtenirTypeFichier = (nomFichier) => {
    const ext = nomFichier.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'jfif'].includes(ext)) return 'image';
    if (['mp4', 'webm'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'm4a', 'ogg'].includes(ext)) return 'audio';
    if (['pdf', 'txt', 'md', 'html', 'js', 'json', 'yml', 'xml'].includes(ext)) return 'document';
    return 'inconnu';
};

export const tronquerNom = (nom) => {
    if (!nom || nom.length <= 35) return nom;
    return `${nom.substring(0, 35)}...`;
};

export const separerNomExtension = (nomComplet) => {
    const indexPoint = nomComplet.lastIndexOf('.');
    if (indexPoint > 0) {
        return {
            nomBase: nomComplet.substring(0, indexPoint),
            extension: nomComplet.substring(indexPoint + 1).toLowerCase()
        };
    }
    return { nomBase: nomComplet, extension: '' };
};
export const obtenirEmojiFichier = (nomFichier) => {
    if (!nomFichier || !nomFichier.includes('.')) return '📄';
    const ext = nomFichier.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'jfif', 'ico'].includes(ext)) return '📷';
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return '🎥';
    if (['mp3', 'wav', 'm4a', 'ogg'].includes(ext)) return '🎵';
    if (['pdf'].includes(ext)) return '📕';
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return '📝';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
    if (['zip', 'rar', '7z', 'tar'].includes(ext)) return '📦';
    if (['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'md', 'py', 'php'].includes(ext)) return '💻';
    
    return '📄';
};