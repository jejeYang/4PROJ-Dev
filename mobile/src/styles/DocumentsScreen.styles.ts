import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    breadcrumbContainer: {
        height: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
        justifyContent: 'center',
    },
    breadcrumbContent: {
        paddingHorizontal: 12,
        alignItems: 'center',
        flexDirection: 'row',
    },
    breadcrumbItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    breadcrumbText: {
        fontSize: 14,
        fontWeight: '500',
    },
    breadcrumbSeparator: {
        fontSize: 14,
        opacity: 0.5,
    },
    actionBar: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 8,
        justifyContent: 'space-between',
        width: '100%',
    },
    actionButton: {
        flex: 1,
        height: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
        overflow: 'hidden',
    },
    actionButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingHorizontal: 2,
    },
    actionButtonIcon: {
        width: 18,
        height: 18,
        marginRight: 4,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
        flexShrink: 1,
    },
    trashInfoContainer: {
        flex: 1,
        height: 44,
        borderRadius: 8,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    trashInfoText: {
        fontSize: 14,
        fontWeight: '600',
    },
    fileItem: {
        flexDirection: 'row',
        padding: 12,
        marginHorizontal: 12,
        marginVertical: 6,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    fileItemContent: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center',
    },
    fileIcon: {
        marginRight: 12,
    },
    iconImage: {
        width: 32,
        height: 32,
    },
    iconText: {
        fontSize: 32,
    },
    fileInfo: {
        flex: 1,
    },
    fileName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    fileDetails: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fileSize: {
        fontSize: 13,
    },
    fileDate: {
        fontSize: 13,
    },
    trashButton: {
        padding: 8,
        marginLeft: 4,
    },
    trashIconImage: {
        width: 20,
        height: 20,
    },
    moreButton: {
        padding: 8,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#8E8E93',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    multipleActionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 54,
    },
    multipleActionBtn: {
        padding: 8,
    },
    multipleActionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    multipleActionTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    multipleBottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        paddingBottom: 24,
        borderTopWidth: 1,
    },
    bottomBarBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    bottomBarIcon: {
        width: 24,
        height: 24,
    },
    emptyList: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIconImage: {
        width: 60,
        height: 60,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalInput: {
        height: 48,
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalButtonIcon: {
        width: 18,
        height: 18,
        tintColor: '#FFFFFF',
    },
    cancelButton: {
        backgroundColor: '#8E8E93',
    },
    cancelButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    moveBreadcrumb: {
        padding: 10,
        marginBottom: 10,
        borderRadius: 8,
    },
    folderList: {
        maxHeight: 300,
        marginVertical: 10,
    },
    folderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginVertical: 4,
        borderRadius: 8,
    },
    folderIconImage: {
        width: 20,
        height: 20,
        marginRight: 10,
    },
    folderName: {
        flex: 1,
        fontSize: 16,
    },
    folderArrow: {
        fontSize: 20,
        opacity: 0.5,
    },
    modalDescription: {
        fontSize: 14,
        marginBottom: 15,
        textAlign: 'center',
    },
    linkContainer: {
        padding: 15,
        borderRadius: 8,
        marginVertical: 10,
    },
    linkText: {
        fontSize: 14,
        textAlign: 'center',
    },
    optionsModalContent: {
        width: '90%',
        maxHeight: '70%',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    optionsHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    optionsTitle: {
        fontSize: 17,
        fontWeight: '600',
        textAlign: 'center',
    },
    optionsList: {
        maxHeight: 400,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    optionIconImage: {
        width: 24,
        height: 24,
        marginRight: 12,
    },
    optionText: {
        fontSize: 16,
        flex: 1,
    },
    cancelOptionButton: {
        padding: 16,
        borderTopWidth: 1,
        alignItems: 'center',
    },
    cancelOptionText: {
        fontSize: 16,
        fontWeight: '600',
    },
    modeToggleContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        borderRadius: 8,
        overflow: 'hidden',
    },
    modeButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#8E8E93',
    },
    modeButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    datePickerButton: {
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    datePickerText: {
        fontSize: 16,
    },
    datePickerOkButton: {
        marginTop: 10,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    datePickerOkButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});