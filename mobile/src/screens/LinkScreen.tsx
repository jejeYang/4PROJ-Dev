import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useMobileTheme } from '../context/MobileThemeContext';
import { apiClient } from '../api/client';

export default function LinkScreen({ navigation }: any) {
    const { user } = useAuth();
    const { theme } = useMobileTheme();
    const [links, setLinks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLinks = async () => {
        try {
            const data = await apiClient.get('/liens');
            setLinks(data);
        }
        catch (error) {
            console.error('Erreur lors du chargement des liens:', error);
            Alert.alert('Erreur', 'Impossible de charger les liens de partage');
        }
        finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchLinks();
        }, [])
    );

    const handleLinkPress = (link: any) => {
        navigation.navigate('Share', { linkId: link.id });
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchLinks();
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.backgroundColor }}>
                <ActivityIndicator size="large" color={theme.primaryColor} />
            </View>
        );
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: theme.backgroundColor }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {links.map((link) => (
                <TouchableOpacity key={link.id} onPress={() => handleLinkPress(link)}>
                    <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: theme.borderColor }}>
                        <Text style={{ color: theme.textColor }}>{link.title}</Text>
                    </View>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );


    
}