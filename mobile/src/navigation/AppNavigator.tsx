import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View, TouchableOpacity, Text as RNText, Alert, Image } from 'react-native';
import { useMobileTheme } from '../context/MobileThemeContext';

// Écrans de l'application
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UploadScreen from '../screens/UploadScreen';
import ShareScreen from '../screens/ShareScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, isLoading, logout } = useAuth();
  const { theme } = useMobileTheme();



  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.backgroundColor }}>
        <ActivityIndicator size="large" color={theme.primaryColor} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={({ navigation }) => {
          const currentRoute = navigation.getState().routes[navigation.getState().index]?.name;
          const isProfileScreen = currentRoute === 'Profile';
          
          return {
            headerStyle: { backgroundColor: theme.headerColor },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
            headerRight: () => (
              user ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
                  {!isProfileScreen && (
                    <TouchableOpacity 
                      onPress={() => navigation.navigate('Profile')}
                      style={{ padding: 5, marginRight: 5 }}
                    >
                      <Image 
                        source={require('../assets/user.png')} 
                        style={{ width: 24, height: 24, tintColor: '#fff' }}
                      />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    onPress={() => {
                      Alert.alert(
                        'Déconnexion',
                        'Êtes-vous sûr de vouloir vous déconnecter ?',
                        [
                          { text: 'Annuler', style: 'cancel' },
                          {
                            text: 'Déconnexion',
                            style: 'destructive',
                            onPress: async () => {
                              if (logout) {
                                await logout();
                              }
                            },
                          },
                        ]
                      );
                    }}
                    style={{ padding: 5 }}
                  >
                    <Image 
                      source={require('../assets/se-deconnecter.png')} 
                      style={{ width: 24, height: 24 }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              ) : null
            ),
          };
        }}
      >
        {user ? (
          <>
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{ title: 'Tableau de bord' }}
            />
            <Stack.Screen 
              name="Documents" 
              component={DocumentsScreen}
              options={{ title: 'Mes documents' }}
            />
            <Stack.Screen 
              name="Upload" 
              component={UploadScreen}
              options={{ title: 'Uploader des fichiers' }}
            />
            <Stack.Screen 
              name="Share" 
              component={ShareScreen}
              options={{ title: 'Partages' }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ title: 'Mon profil' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
