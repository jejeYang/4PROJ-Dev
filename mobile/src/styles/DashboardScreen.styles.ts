import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 30,
    },
    quickActions: {
        gap: 16,
    },
    actionCard: {
        padding: 24,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    primaryCard: {
        shadowColor: '#007AFF',
        shadowOpacity: 0.3,
    },
    cardIcon: {
        fontSize: 40,
        marginBottom: 12,
    },
    cardIconImage: {
        width: 40,
        height: 40,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 6,
    },
    cardDescription: {
        fontSize: 14,
    },
});