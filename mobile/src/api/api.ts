import { apiClient } from './client';
import { API_ENDPOINTS, API_BASE_URL } from '../config';

// Fonction helper pour encoder les noms de fichiers
// Le backend fait un decodeURIComponent après qu'Express ait déjà décodé l'URL
// Donc si le nom contient déjà des % (fichiers encodés), on doit encoder deux fois
const encodeFileName = (fileName: string): string => {
  // Si le nom contient déjà des %, c'est un nom encodé (ex: "test%20file.txt")
  // On doit l'encoder deux fois pour compenser le double décodage
  if (fileName.includes('%')) {
    return encodeURIComponent(encodeURIComponent(fileName));
  }
  // Sinon, encodage normal
  return encodeURIComponent(fileName);
};

export interface LoginCredentials {
  email: string;
  mdp: string;
}

export interface RegisterData {
  nom: string;
  email: string;
  mdp: string;
}

export interface User {
  id: number;
  nom: string;
  email: string;
  stockageCompte?: number;
  idCompte?: number;
  nomCompte?: string;
  adresseMailCompte?: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  message: string;
  utilisateur: User;
  token: string;
}

export interface Dossier {
  idDossier: number;
  idCompteCreateur: number;
  idDossierParent: number | null;
  cheminDaccesDossier: string;
  status?: string;
}

export interface Fichier {
  nom: string;
  taille: number;
  dateModification?: string;
  type?: string;
}

// API d'authentification
export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<AuthResponse>(API_ENDPOINTS.LOGIN, credentials),

  register: (data: RegisterData) =>
    apiClient.post<AuthResponse>(API_ENDPOINTS.REGISTER, data),

  googleAuth: (idToken: string) =>
    apiClient.post<AuthResponse>(API_ENDPOINTS.GOOGLE_AUTH, { idToken }),
};

// API des dossiers
export const dossierApi = {
  // Récupérer les dossiers racine d'un compte
  getDossiersRacine: (idCompte: number) =>
    apiClient.get<Dossier[]>(`/api/comptes/${idCompte}/dossiers`),

  // Récupérer les sous-dossiers d'un dossier
  getSousDossiers: (idDossier: number) =>
    apiClient.get<Dossier[]>(`/api/dossiers/${idDossier}/sous-dossiers`),

  // Récupérer les fichiers d'un dossier
  getFichiers: (idDossier: number) =>
    apiClient.get<Fichier[]>(`/api/dossiers/${idDossier}/fichiers`),

  getDossiers: () =>
    apiClient.get<Dossier[]>(API_ENDPOINTS.DOSSIERS),

  getDossierById: (id: number) =>
    apiClient.get<Dossier>(`${API_ENDPOINTS.DOSSIERS}/${id}`),

  createDossier: (data: { cheminDaccesDossier: string; idDossierParent?: number }) =>
    apiClient.post<Dossier>(API_ENDPOINTS.DOSSIERS, data),

  deleteDossier: (id: number) =>
    apiClient.delete(`${API_ENDPOINTS.DOSSIERS}/${id}`),
  
  deleteFichier: (idDossier: number, nomFichier: string) =>
    apiClient.delete(`/api/dossiers/${idDossier}/fichiers/${encodeFileName(nomFichier)}`),

  // Pour la visualisation, on utilise un encodage simple car le backend utilise res.sendFile()
  // qui décode automatiquement l'URL une fois
  getFileUrl: (idDossier: number, nomFichier: string) => {
    return `${API_BASE_URL}/api/dossiers/${idDossier}/fichiers/${encodeURIComponent(nomFichier)}`;
  },

  uploadFile: (dossierId: number, file: FormData) =>
    apiClient.post(`${API_ENDPOINTS.UPLOAD}/${dossierId}`, file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  downloadFile: (dossierId: number, fileName: string) =>
    apiClient.get(`${API_ENDPOINTS.DOWNLOAD}/${dossierId}/${encodeFileName(fileName)}`, {
      responseType: 'blob',
    }),

  // Déplacer un dossier vers la corbeille
  moveToTrash: (idDossier: number) =>
    apiClient.delete(`/api/dossiers/${idDossier}/vers-corbeille`),

  // Déplacer un fichier vers la corbeille
  moveFileToTrash: (idDossier: number, nomFichier: string) =>
    apiClient.delete(`/api/dossiers/${idDossier}/fichiers/${encodeFileName(nomFichier)}/vers-corbeille`),

  // Restaurer un dossier depuis la corbeille
  restoreDossier: (idDossier: number) =>
    apiClient.post(`/api/dossiers/${idDossier}/restaurer`),

  // Restaurer un fichier depuis la corbeille
  restoreFichier: (nomFichier: string) =>
    apiClient.post(`/api/corbeille/fichiers/${encodeFileName(nomFichier)}/restaurer`),

  // Déplacer un dossier vers un autre dossier
  moveDossier: (idDossier: number, idNouveauDossierParent: number) =>
    apiClient.put(`/api/dossiers/${idDossier}/deplacer`, { idNouveauDossierParent }),

  // Déplacer un fichier vers un autre dossier
  moveFichier: (idDossierActuel: number, nomFichier: string, idNouveauDossierParent: number) =>
    apiClient.put(`/api/dossiers/${idDossierActuel}/fichiers/${encodeFileName(nomFichier)}/deplacer`, { idNouveauDossierParent }),

  // Télécharger un dossier en ZIP
  downloadZip: (idDossier: number) =>
    apiClient.get(`/api/telechargerZip`, {
      params: { idDossier },
      responseType: 'blob',
    }),

  // Vider la corbeille
  emptyTrash: () =>
    apiClient.delete('/api/corbeille/vider'),
};

// API des liens de partage
export const lienApi = {
  // Créer un lien de partage pour un dossier ou fichier
  createShareLink: (dossierId: number, data: {
    email: string;
    fileName?: string;
    motDePasse?: string;
    mdpLienGenere?: string;
    dateExpiration?: string;
  }) =>
    apiClient.post(`/api/dossiers/${dossierId}/partager`, data),

  // Accéder à un lien de partage
  accessShareLink: (token: string) =>
    apiClient.get(`/api/liens/${token}`),
};
