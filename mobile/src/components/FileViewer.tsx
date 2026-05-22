import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image as RNImage,
  Platform,
} from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import Slider from '@react-native-community/slider';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useAudioPlayer } from 'expo-audio';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMobileTheme } from '../context/MobileThemeContext';

interface FileViewerProps {
  visible: boolean;
  fileUrl: string;
  fileName: string;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

// Sous-composant pour vidéos - Version SDK 54
function VideoViewer({ localUri }: { localUri: string | null }) {
  const player = useVideoPlayer(localUri || '');
  return <VideoView style={styles.video} player={player} />;
}

// Sous-composant pour PDF - Ouvre avec le viewer système
function PDFViewer({ localUri, fileName, theme }: { localUri: string | null; fileName: string; theme: any }) {
  const [isOpening, setIsOpening] = React.useState(false);

  const openPdfWithSystemViewer = async () => {
    if (!localUri) return;
    
    try {
      setIsOpening(true);
      console.log('PDFViewer - Ouverture avec le viewer système:', localUri);
      
      if (Platform.OS === 'android') {
        // Sur Android : On génère une URI content:// et on force l'ouverture en mode "Vue"
        const contentUri = await (FileSystem as any).getContentUriAsync(localUri);
        
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION (Autorise l'app tierce à lire le PDF)
          type: 'application/pdf',
        });
      }
      
      setIsOpening(false);
    } catch (error) {
      console.error('PDFViewer - Erreur ouverture:', error);
      alert('Impossible d\'ouvrir le fichier. Vérifiez qu\'une application de lecture de PDF (comme Google Drive ou Adobe Reader) est installée sur cet appareil.');
      setIsOpening(false);
    }
  };

  return (
    <View style={styles.pdfContainer}>
      <RNImage
        source={require('../assets/docs.png')}
        style={styles.pdfIcon}
      />
      <Text style={[styles.pdfFileName, { color: theme.textColor }]}>
        {fileName}
      </Text>
      <Text style={[styles.pdfDescription, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
        Appuyez sur le bouton ci-dessous pour ouvrir le PDF dans votre lecteur préféré
      </Text>
      <TouchableOpacity
        style={[styles.openPdfButton, { backgroundColor: theme.primaryColor }]}
        onPress={openPdfWithSystemViewer}
        disabled={isOpening}
      >
        {isOpening ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.openPdfButtonText}>📄 Ouvrir le PDF</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

// Sous-composant pour audio - Version SDK 54 avec contrôles complets
function AudioViewer({ localUri, fileName, theme }: { localUri: string | null; fileName: string; theme: any }) {
  // State local pour forcer le re-render
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isSeeking, setIsSeeking] = React.useState(false);
  
  // Créer un objet source avec useMemo pour éviter les re-renders inutiles
  const source = React.useMemo(() => {
    return localUri ? { uri: localUri } : null;
  }, [localUri]);
  
  // Ne créer le player que si source existe
  const audioPlayer = useAudioPlayer(source as any);
  
  // Essayer de charger/préparer le fichier audio
  React.useEffect(() => {
    if (localUri && audioPlayer) {
      console.log('AudioViewer - Tentative de chargement du fichier');
      // Essayer de déclencher le chargement en appelant play puis pause immédiatement
      setTimeout(() => {
        try {
          audioPlayer.play();
          setTimeout(() => {
            audioPlayer.pause();
            setIsPlaying(false);
          }, 100);
        } catch (error) {
          console.error('Erreur lors de l\'initialisation:', error);
        }
      }, 500);
    }
  }, [localUri]);
  
  // Mettre à jour la durée totale quand elle est disponible
  React.useEffect(() => {
    if (audioPlayer.duration && audioPlayer.duration > 0) {
      setDuration(audioPlayer.duration);
    }
  }, [audioPlayer.duration]);
  
  // Mettre à jour le temps actuel toutes les 100ms pendant la lecture
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (audioPlayer.playing && !isSeeking) {
      interval = setInterval(() => {
        setCurrentTime(audioPlayer.currentTime);
        setIsPlaying(true);
      }, 100);
    } else {
      setIsPlaying(audioPlayer.playing);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [audioPlayer.playing, isSeeking]);
  
  const togglePlayPause = () => {
    try {
      if (audioPlayer.playing) {
        audioPlayer.pause();
        setIsPlaying(false);
      } else {
        audioPlayer.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Erreur lecture audio:', error);
    }
  };
  
  const handleSeek = (value: number) => {
    setIsSeeking(true);
    setCurrentTime(value);
  };
  
  const handleSeekComplete = (value: number) => {
    try {
      audioPlayer.seekTo(value);
      setCurrentTime(value);
      setIsSeeking(false);
    } catch (error) {
      console.error('Erreur lors du seek:', error);
      setIsSeeking(false);
    }
  };
  
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.audioContainer}>
      <RNImage
        source={require('../assets/fichier-audio.png')}
        style={styles.audioIcon}
      />
      <Text style={[styles.audioFileName, { color: theme.textColor }]}>
        {fileName}
      </Text>
      
      {/* Contrôles de lecture */}
      <View style={styles.audioControls}>
        {/* Barre de progression */}
        <View style={styles.progressContainer}>
          <Text style={[styles.timeText, { color: theme.textColor }]}>
            {formatTime(currentTime)}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration || 1}
            value={currentTime}
            onValueChange={handleSeek}
            onSlidingComplete={handleSeekComplete}
            minimumTrackTintColor={theme.primaryColor}
            maximumTrackTintColor={theme.isDark ? '#3A3A3C' : '#E5E5EA'}
            thumbTintColor={theme.primaryColor}
          />
          <Text style={[styles.timeText, { color: theme.textColor }]}>
            {formatTime(duration)}
          </Text>
        </View>
        
        {/* Bouton play/pause */}
        <TouchableOpacity
          style={styles.playPauseButton}
          onPress={togglePlayPause}
        >
          <RNImage
            source={isPlaying ? require('../assets/pause.png') : require('../assets/play.png')}
            style={styles.playPauseIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function FileViewer({ visible, fileUrl, fileName, onClose }: FileViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const { theme } = useMobileTheme();

  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  const videoExtensions = ['mp4', 'mov', 'm4v', 'avi', 'mkv'];
  const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];
  const pdfExtensions = ['pdf'];
  const docExtensions = ['txt'];

  const isImage = imageExtensions.includes(fileExtension);
  const isVideo = videoExtensions.includes(fileExtension);
  const isAudio = audioExtensions.includes(fileExtension);
  const isPDF = pdfExtensions.includes(fileExtension);
  const isDoc = docExtensions.includes(fileExtension);

  useEffect(() => {
    if (visible) {
      loadFile();
    } else {
      cleanup();
    }
    return () => {
      cleanup();
    };
  }, [visible, fileUrl]);

  const cleanup = () => {
    setLocalUri(null);
    setIsLoading(true);
    setError(null);
  };

  const loadFile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('@supfile_token');
      if (!token) {
        setError('Non authentifié');
        setIsLoading(false);
        return;
      }

      // Nettoie le nom de fichier pour le système de fichiers local
      // Remplace les caractères problématiques par des underscores
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const timestamp = Date.now();
      const docDir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || '';
      const fileUri = `${docDir}${timestamp}_${cleanFileName}`;

      console.log('FileViewer - Téléchargement:', {
        from: fileUrl,
        to: fileUri,
        fileName: fileName,
        cleanFileName: cleanFileName
      });

      // Télécharger le fichier
      const downloadResult = await FileSystem.downloadAsync(
        fileUrl,
        fileUri,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      console.log('FileViewer - Résultat téléchargement:', downloadResult);

      if (downloadResult.status === 200) {
        setLocalUri(downloadResult.uri);
      } else {
        console.error('FileViewer - Erreur status:', downloadResult.status);
        setError(`Impossible de télécharger le fichier (${downloadResult.status})`);
      }
    } catch (err: any) {
      console.error('FileViewer - Erreur chargement fichier:', err);
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primaryColor} />
          <Text style={[styles.loadingText, { color: theme.textColor }]}>
            Chargement...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: '#FF3B30' }]}>
            {error}
          </Text>
        </View>
      );
    }

    if (!localUri) {
      return null;
    }

    if (isImage) {
      return (
        <RNImage
          source={{ uri: localUri }}
          style={styles.image}
          resizeMode="contain"
        />
      );
    }

    if (isVideo) {
      return <VideoViewer localUri={localUri} />;
    }

    if (isAudio) {
      return <AudioViewer localUri={localUri} fileName={fileName} theme={theme} />;
    }

    if (isPDF) {
      return <PDFViewer localUri={localUri} fileName={fileName} theme={theme} />;
    }

    if (isDoc) {
      return (
        <WebView
          source={{ uri: localUri }}
          style={styles.webview}
          startInLoadingState
          renderLoading={() => (
            <ActivityIndicator
              size="large"
              color={theme.primaryColor}
              style={styles.webviewLoader}
            />
          )}
        />
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.errorText, { color: theme.textColor }]}>
          Type de fichier non pris en charge pour la prévisualisation
        </Text>
        <Text style={[styles.errorSubtext, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
          {fileName}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7' }]}>
          <Text style={[styles.headerTitle, { color: theme.textColor }]} numberOfLines={1}>
            {fileName}
          </Text>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.isDark ? '#3A3A3C' : '#E5E5EA' }]}
            onPress={onClose}
          >
            <Text style={[styles.closeButtonText, { color: theme.textColor }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  image: {
    width: width,
    height: height - 100,
  },
  video: {
    width: width,
    height: height - 100,
  },
  audioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  audioIcon: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  audioFileName: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
  },
  audioControls: {
    width: '100%',
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    marginHorizontal: 12,
    height: 40,
  },
  playPauseButton: {
    padding: 8,
  },
  playPauseIcon: {
    width: 48,
    height: 48,
  },
  pdfContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  pdfIcon: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  pdfFileName: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  pdfDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  openPdfButton: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  openPdfButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
  webviewLoader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
  },
});
