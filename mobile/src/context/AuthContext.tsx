import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, User, LoginCredentials, RegisterData } from '../api/api';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserData: (userData: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = '@supfile_token';
const USER_KEY = '@supfile_user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les données au démarrage
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        apiClient.setToken(storedToken);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'authentification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authApi.login(credentials);
      await saveAuth(response.token, response.utilisateur);
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authApi.register(data);
      await saveAuth(response.token, response.utilisateur);
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      throw error;
    }
  };

  const googleLogin = async (idToken: string) => {
    try {
      const response = await authApi.googleAuth(idToken);
      await saveAuth(response.token, response.utilisateur);
    } catch (error) {
      console.error('Erreur lors de la connexion Google:', error);
      throw error;
    }
  };

  const saveAuth = async (authToken: string, userData: User) => {
    // Normaliser les données utilisateur pour garantir la cohérence dans l'application 
    const normalizedUser: User = {
      id: userData.id || userData.idCompte || 0,
      nom: userData.nom || userData.nomCompte || '',
      email: userData.email || userData.adresseMailCompte || '',
      stockageCompte: userData.stockageCompte || 0,
      avatarUrl: userData.avatarUrl,
    };
    
    // Si l'avatarUrl contient localhost, le remplacer par l'IP locale du mobile
    if (normalizedUser.avatarUrl && normalizedUser.avatarUrl.includes('localhost')) {
      const { API_BASE_URL } = await import('../config');
      normalizedUser.avatarUrl = normalizedUser.avatarUrl.replace('http://localhost:3000', API_BASE_URL);
    }
    
    await AsyncStorage.setItem(TOKEN_KEY, authToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
    setToken(authToken);
    setUser(normalizedUser);
    apiClient.setToken(authToken);
  };

  const refreshUser = async () => {
    try {
      // Rafraîchir depuis AsyncStorage uniquement
      const storedUser = await AsyncStorage.getItem(USER_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du profil:', error);
    }
  };

  const updateUserData = async (userData: User) => {
    try {
      console.log('Updating user data with:', userData);
      
      // Normaliser les données utilisateur (comme dans saveAuth)
      const normalizedUser: User = {
        id: userData.id || userData.idCompte || 0,
        nom: userData.nom || userData.nomCompte || '',
        email: userData.email || userData.adresseMailCompte || '',
        stockageCompte: userData.stockageCompte || 0,
        avatarUrl: userData.avatarUrl,
      };
      
      console.log('Normalized user:', normalizedUser);
      
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
      setUser(normalizedUser);
    } catch (error) {
      console.error('Error in updateUserData:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
      apiClient.clearToken();
      
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        googleLogin,
        refreshUser,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};
