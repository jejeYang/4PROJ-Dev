import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMobileTheme } from '../context/MobileThemeContext';

export default function Footer() {
  const navigation = useNavigation<any>();
  const { theme } = useMobileTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.footer, { borderTopColor: theme.isDark ? '#3A3A3C' : '#E5E5EA', paddingBottom: insets.bottom + 8 }]}>
      <TouchableOpacity onPress={() => navigation.navigate('Conditions')}>
        <Text style={[styles.lien, { color: theme.primaryColor }]}>
          Conditions d'utilisation
        </Text>
      </TouchableOpacity>
      <Text style={[styles.separateur, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
        {' '}|{' '}
      </Text>
      <Text style={[styles.copyright, { color: theme.isDark ? '#8E8E93' : '#6C6C70' }]}>
        © 2026 SUPFile
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  lien: {
    fontSize: 12,
    fontWeight: '500',
  },
  separateur: {
    fontSize: 12,
  },
  copyright: {
    fontSize: 12,
  },
});
