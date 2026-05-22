import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarText: {
        fontSize: 40,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    editAvatarBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#007AFF',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    editAvatarIcon: {
        fontSize: 16,
    },
    avatarHint: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    themeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    themeContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    themeIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    themeTextContainer: {
        flex: 1,
    },
    themeTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    themeSubtitle: {
        fontSize: 14,
    },
    chevron: {
        fontSize: 24,
        fontWeight: '300',
    },
    section: {
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        height: 48,
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    inputDisabled: {
        opacity: 0.6,
    },
    button: {
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        flex: 1,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelButton: {
        backgroundColor: '#8E8E93',
    },
    cancelButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    dangerSection: {
        borderWidth: 2,
        borderColor: '#ff3b30',
        borderStyle: 'dashed',
    },
    dangerText: {
        fontSize: 14,
        marginBottom: 16,
        opacity: 0.8,
    },
    dangerButton: {
        height: 48,
        backgroundColor: '#ff3b30',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dangerButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        height: 48,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    logoutButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 12,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalText: {
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20,
    },
    modalInput: {
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
});