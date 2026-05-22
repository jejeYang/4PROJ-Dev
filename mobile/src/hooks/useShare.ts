import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { apiClient } from '../api/client';
import { API_BASE_URL } from '../config';

export interface PartageRecu {
  idDossier: number;
  cheminDaccesDossier: string;
  emailContact: string;
  dateCreation: string;
}

export interface PartageEnvoye {
  idDossier: number;
  cheminDaccesDossier: string;
  emailContact: string;
  dateCreation: string;
}

export interface LienPublic {
  idLien: number;
  nom: string;
  type: string;
  url: string;
  protege: boolean;
  dateExpiration: string | null;
  createdAt: string;
}

export function useShare(navigation: any) {
  const [partagesRecus, setPartagesRecus] = useState<PartageRecu[]>([]);
  const [partagesEnvoyes, setPartagesEnvoyes] = useState<PartageEnvoye[]>([]);
  const [liensPublics, setLiensPublics] = useState<LienPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllPartages = useCallback(async () => {
    try {
      const [resRecus, resEnvoyes, resLiens] = await Promise.all([
        apiClient.get<PartageRecu[]>('/api/partage/recus'),
        apiClient.get<PartageEnvoye[]>('/api/partage/envoyes'),
        apiClient.get<LienPublic[]>('/api/partage/mes-liens'),
      ]);

      setPartagesRecus(resRecus);
      setPartagesEnvoyes(resEnvoyes);
      setLiensPublics(resLiens);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des partages:', error);
      Alert.alert('Erreur', 'Impossible de charger les partages');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllPartages();
  };

  const supprimerLienPublic = async (idLien: number) => {
    Alert.alert(
      'Supprimer le lien',
      'Êtes-vous sûr de vouloir supprimer ce lien de partage ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/partage/lien/${idLien}`);
              setLiensPublics(prev => prev.filter(l => l.idLien !== idLien));
              Alert.alert('Succès', 'Lien supprimé avec succès');
            } catch (error: any) {
              Alert.alert('Erreur', 'Impossible de supprimer le lien');
            }
          },
        },
      ]
    );
  };

  const resilierPartageInterne = async (idDossier: number, type: 'recu' | 'envoye') => {
    const message = type === 'envoye' 
      ? 'Cela supprimera l\'accès pour tous les participants. Confirmer ?'
      : 'Voulez-vous quitter ce partage ?';
    
    Alert.alert(
      type === 'envoye' ? 'Révoquer le partage' : 'Quitter le partage',
      message,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: type === 'envoye' ? 'Révoquer' : 'Quitter',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/partage/interne/${idDossier}`);
              fetchAllPartages();
              Alert.alert('Succès', 'Partage révoqué avec succès');
            } catch (error: any) {
              Alert.alert('Erreur', 'Impossible de révoquer le partage');
            }
          },
        },
      ]
    );
  };

  const allerVersDossier = (idDossier: number) => {
    navigation.navigate('Documents', { folderId: idDossier });
  };

  const copierLien = async (url: string) => {
    try {
      const fullUrl = `${API_BASE_URL}${url}`;
      await Clipboard.setStringAsync(fullUrl);
      Alert.alert('Succès', 'Lien copié dans le presse-papier !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de copier le lien');
    }
  };

  return {
    partagesRecus,
    partagesEnvoyes,
    liensPublics,
    isLoading,
    refreshing,
    fetchAllPartages,
    onRefresh,
    supprimerLienPublic,
    resilierPartageInterne,
    allerVersDossier,
    copierLien,
  };
}
