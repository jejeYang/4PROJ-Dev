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
        marginBottom: 24,
    },
    loadingSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        marginBottom: 20,
    },
    loadingText: {
        marginLeft: 10,
        fontSize: 14,
    },
    destinationSection: {
        marginBottom: 20,
    },
    breadcrumb: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 12,
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
    },
    currentFolderButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
    },
    currentFolderButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    foldersList: {
        marginTop: 8,
    },
    subSectionTitle: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    folderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    folderIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    folderIconImage: {
        width: 24,
        height: 24,
        marginRight: 12,
    },
    folderName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    chevron: {
        fontSize: 24,
        fontWeight: '300',
    },
    noSubFolders: {
        fontSize: 14,
        fontStyle: 'italic',
        marginTop: 8,
        textAlign: 'center',
    },
    dossierList: {
        flexDirection: 'row',
    },
    dossierChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 10,
    },
    dossierChipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    uploadOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        gap: 12,
    },
    optionButton: {
        flex: 1,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    optionIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    optionIconImage: {
        width: 32,
        height: 32,
        marginBottom: 8,
    },
    optionText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    filesSection: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    sectionTitleIcon: {
        width: 20,
        height: 20,
        marginRight: 8,
    },
    fileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    fileInfo: {
        flex: 1,
    },
    fileName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    fileSize: {
        fontSize: 14,
    },
    removeButton: {
        padding: 8,
    },
    removeIcon: {
        fontSize: 18,
    },
    progressSection: {
        marginVertical: 20,
    },
    progressText: {
        fontSize: 14,
        marginBottom: 8,
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    uploadButton: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    uploadButtonDisabled: {
        opacity: 0.6,
    },
    uploadButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyState: {
        padding: 40,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyIconImage: {
        width: 64,
        height: 64,
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
});