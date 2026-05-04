import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Theme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  headerColor: string;
  isDark: boolean;
}

const lightTheme: Theme = {
  primaryColor: '#00BCD4',
  secondaryColor: '#0097A7',
  backgroundColor: '#FFFFFF',
  textColor: '#000000',
  headerColor: '#2d3561',
  isDark: false,
};

const darkTheme: Theme = {
  primaryColor: '#26C6DA',
  secondaryColor: '#00ACC1',
  backgroundColor: '#1C1C1E',
  textColor: '#FFFFFF',
  headerColor: '#2d3561',
  isDark: true,
};

interface MobileThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const MobileThemeContext = createContext<MobileThemeContextType | undefined>(undefined);

const THEME_KEY = '@supfile_theme';

export const MobileThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(lightTheme);

  React.useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem(THEME_KEY);
      if (storedTheme === 'dark') {
        setTheme(darkTheme);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du thème:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = theme.isDark ? lightTheme : darkTheme;
      setTheme(newTheme);
      await AsyncStorage.setItem(THEME_KEY, newTheme.isDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du thème:', error);
    }
  };

  return (
    <MobileThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </MobileThemeContext.Provider>
  );
};

export const useMobileTheme = () => {
  const context = useContext(MobileThemeContext);
  if (!context) {
    throw new Error('useMobileTheme doit être utilisé dans un MobileThemeProvider');
  }
  return context;
};
