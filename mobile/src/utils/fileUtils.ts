export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 octets';
  const k = 1024;
  const sizes = ['octets', 'Ko', 'Mo', 'Go', 'To'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const getFileType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'jfif'].includes(ext)) return 'image';
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'm4a', 'ogg'].includes(ext)) return 'audio';
  if (['pdf', 'txt', 'md', 'html', 'js', 'json', 'yml', 'xml'].includes(ext)) return 'document';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'bureautique';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
  
  return 'autre';
};

export const getFileTypeEmoji = (type: string): string => {
  switch (type) {
    case 'image': return '🖼️';
    case 'video': return '🎥';
    case 'audio': return '🎵';
    case 'document': return '📄';
    case 'bureautique': return '📊';
    case 'archive': return '📦';
    default: return '📁';
  }
};

export const getFileTypeLabel = (type: string): string => {
  switch (type) {
    case 'image': return 'Images';
    case 'video': return 'Vidéos';
    case 'audio': return 'Audio';
    case 'document': return 'Documents';
    case 'bureautique': return 'Bureautique';
    case 'archive': return 'Archives';
    default: return 'Autres';
  }
};
