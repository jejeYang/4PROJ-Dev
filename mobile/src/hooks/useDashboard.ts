import { useAuth } from '../context/AuthContext';

export function useDashboard(navigation: any) {
    const { user } = useAuth();

    const navigateToDocuments = () => {
        navigation.navigate('Documents');
    };

    const navigateToUpload = () => {
        navigation.navigate('Upload');
    };

    return {
        user,
        navigateToDocuments,
        navigateToUpload,
    };
}