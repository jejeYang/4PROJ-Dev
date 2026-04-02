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
