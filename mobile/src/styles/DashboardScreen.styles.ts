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
        marginBottom: 20,
    },
    storageCard: {
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    storageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    storageTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    storagePercentage: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    storageBar: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    storageBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    storageText: {
        fontSize: 14,
    },
    distributionCard: {
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    distributionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    distributionItem: {
        marginBottom: 16,
    },
    distributionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    distributionLabel: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    distributionEmoji: {
        fontSize: 20,
        marginRight: 8,
    },
    distributionType: {
        fontSize: 16,
        fontWeight: '500',
    },
    distributionCount: {
        fontSize: 14,
    },
    distributionBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    distributionBarFill: {
        height: '100%',
        borderRadius: 3,
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
    recentCard: {
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
    },
    recentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    recentTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    recentVoirTout: {
        fontSize: 13,
        fontWeight: '500',
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    recentItemEmoji: {
        fontSize: 22,
        marginRight: 12,
        width: 30,
        textAlign: 'center',
    },
    recentItemInfo: {
        flex: 1,
    },
    recentItemNom: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 2,
    },
    recentItemMeta: {
        fontSize: 12,
    },
    recentChevron: {
        fontSize: 20,
        marginLeft: 8,
    },
});