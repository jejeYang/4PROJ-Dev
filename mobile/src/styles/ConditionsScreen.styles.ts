import { StyleSheet } from 'react-native';

interface Theme {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  isDark: boolean;
}

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    entete: {
      marginBottom: 28,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.isDark ? '#3A3A3C' : '#E5E5EA',
    },
    titre: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.textColor,
      marginBottom: 6,
      lineHeight: 28,
    },
    sousTitre: {
      fontSize: 13,
      color: theme.isDark ? '#8E8E93' : '#6C6C70',
    },
    section: {
      marginBottom: 24,
      backgroundColor: theme.isDark ? '#2C2C2E' : '#F2F2F7',
      borderRadius: 12,
      padding: 16,
    },
    sectionTitre: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.primaryColor,
      marginBottom: 10,
    },
    sectionTexte: {
      fontSize: 14,
      color: theme.textColor,
      lineHeight: 22,
    },
    liste: {
      marginVertical: 8,
      paddingLeft: 4,
    },
    listeItem: {
      fontSize: 14,
      color: theme.textColor,
      lineHeight: 22,
      marginBottom: 4,
    },
    piedDePage: {
      marginTop: 8,
      alignItems: 'center',
    },
    piedDePageTexte: {
      fontSize: 12,
      color: theme.isDark ? '#8E8E93' : '#6C6C70',
    },
  });
