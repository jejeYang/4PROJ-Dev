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
    breadcrumb: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
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
        padding: 12,
        gap: 8,
    },
    actionButton: {
        flex: 1,
        height: 44,\r
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButtonIcon: {
        width: 18,
        height: 18,
        marginRight: 4,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    listContainer: {
        paddingBottom: 80,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    itemIcon: {
        width: 28,
        height: 28,
        marginRight: 12,
    },
    itemTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    itemText: {
        fontSize: 16,
        fontWeight: '500',
    },
    itemMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    itemDateText: {
        fontSize: 12,
        opacity: 0.55,
    },
    metaSeparator: {
        fontSize: 12,
        marginHorizontal: 6,
        opacity: 0.4,
    },
    itemSizeText: {
        fontSize: 12,
        opacity: 0.55,
    },
    optionsButton: {
        padding: 8,
    },
    optionsIcon: {
        width: 20,
        height: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        borderRadius: 14,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    input: {
        width: '100%',
        height: 44,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 16,
        fontSize: 15,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        height: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    moveFolderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
        justifyContent: 'space-between',
    },
    moveFolderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    moveFolderIcon: {
        width: 24,
        height: 24,
    },
    moveFolderName: {
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
        width: '100%',
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
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    optionIconImage: {
        width: 22,
        height: 22,
        marginRight: 12,
    },
    optionText: {
        fontSize: 16,
    },
    cancelOptionButton: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopWidth: 1,
    },
    cancelOptionText: {
        fontSize: 17,
        fontWeight: '600',
    }
});