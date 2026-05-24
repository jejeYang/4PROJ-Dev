# Mobile SupFile

L'application mobile est developpee avec Expo et React Native. Elle communique avec l'API backend de SupFile, disponible sur le port `3000`.

## Lancement local
Depuis le dossier `mobile` :

```bash
npm install
npm start
```

Expo demarre ensuite un serveur local. Pour ouvrir l'application, utiliser Expo Go sur un telephone, puis scanner le QR code affiche dans le terminal ou ouvrir le lien Expo propose.

## Prerequis
- Installer Expo Go sur le telephone, en version compatible avec Expo 54.
- Avoir le telephone et l'ordinateur sur le meme reseau.
- Lancer le backend SupFile avant d'utiliser l'application mobile.
- Configurer l'adresse IP locale de l'ordinateur dans `src/config.ts`.

Exemple :

```ts
export const API_BASE_URL = 'http://192.168.x.x:3000';
```

L'adresse `192.168.x.x` doit etre remplacee par l'adresse IP locale de l'ordinateur qui lance le backend.

## Scripts utiles

| Commande | Role |
| --- | --- |
| `npm start` | Lance Expo et affiche le QR code. |
| `npm run android` | Lance Expo avec une cible Android. |
| `npm run ios` | Lance Expo avec une cible iOS. |

## Structure principale

```text
mobile/
|-- android/             # Projet Android genere par Expo
|-- src/
|   |-- api/             # Client API et appels vers le backend
|   |-- assets/          # Images et icones de l'application
|   |-- components/      # Composants reutilisables
|   |-- context/         # Authentification et theme mobile
|   |-- hooks/           # Logique reutilisable des ecrans
|   |-- navigation/      # Navigation entre les ecrans
|   |-- screens/         # Ecrans principaux de l'application
|   |-- styles/          # Styles par ecran
|   |-- types/           # Types TypeScript
|   `-- utils/           # Fonctions utilitaires
|-- App.tsx              # Point d'entree de l'application
|-- app.json             # Configuration Expo
|-- package.json         # Scripts et dependances npm
`-- tsconfig.json        # Configuration TypeScript
```

## Ecrans principaux

- `LoginScreen` et `RegisterScreen` : connexion et creation de compte.
- `DashboardScreen` : resume de l'espace utilisateur et acces aux actions principales.
- `DocumentsScreen` : navigation dans les dossiers, consultation, recherche, tri et gestion des fichiers.
- `UploadScreen` : ajout de fichiers depuis le telephone.
- `ShareScreen` : gestion des liens publics, partages envoyes et partages recus.
- `LinkScreen` : consultation d'un lien public partage.
- `ProfileScreen` : modification du profil, du theme et de certaines informations du compte.
- `ConditionsScreen` : conditions d'utilisation.

## Fonctionnement

Le contexte `AuthContext` garde l'etat de connexion de l'utilisateur. Le fichier `src/api/client.ts` centralise les appels HTTP avec Axios et ajoute le token d'authentification aux requetes quand il est disponible.

Les hooks situes dans `src/hooks` regroupent la logique metier des ecrans : authentification, documents, tableau de bord, upload, partages, liens publics, profil et selection multiple.

Le theme mobile est gere par `MobileThemeContext`, ce qui permet d'appliquer les couleurs de l'application de maniere coherente entre les ecrans.
