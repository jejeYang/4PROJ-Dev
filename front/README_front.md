# Frontend SupFile

Le front est une application React lancee avec Vite. Il communique avec l'API backend disponible par defaut sur `http://localhost:3000`.

Le front est lancé automatiquement avec la commande Docker depuis la racine du projet :
```bash
docker compose up --build
```

L'interface est ensuite disponible sur :
- Frontend : `http://localhost:5173`

## Lancement local
Depuis le dossier `front` :

```bash
npm install
npm run dev
```

## Configuration
La connexion Google est optionnelle, mais elle doit etre configuree si l'on veut afficher le bouton de connexion Google.

Variable principale :

| Variable | Role |
| --- | --- |
| `VITE_GOOGLE_CLIENT_ID` | Client ID OAuth Google utilise par le composant de connexion Google. |

Exemple PowerShell :

```powershell
$env:VITE_GOOGLE_CLIENT_ID = "votre-client-id.apps.googleusercontent.com"
npm run dev
```

## Structure principale

```text
front/
|-- public/              # Fichiers statiques servis par Vite
|-- src/
|   |-- assets/          # Images et logos de l'application
|   |-- components/      # Composants reutilisables
|   |-- context/         # Contexte React, notamment le theme
|   |-- hooks/           # Logique reutilisable des pages
|   |-- pages/           # Pages principales de l'interface
|   |-- styles/          # Feuilles de style par page
|   `-- utils/           # Fonctions utilitaires
|-- index.html           # Page HTML racine
|-- package.json         # Scripts et dependances npm
`-- vite.config.js       # Configuration Vite
```

## Pages principales

- `Home` : page d'accueil et resume de l'espace utilisateur.
- `Login` et `Register` : connexion, inscription et connexion Google.
- `Dashboard` : navigation dans les dossiers, affichage des fichiers, recherche, tri, apercu, renommage, deplacement, suppression et restauration.
- `Upload` : televersement de fichiers dans un dossier choisi.
- `Partage` : suivi des liens publics, partages envoyes et partages recus.
- `Lien` : consultation et telechargement depuis un lien public partage.
- `Settings` : modification du profil, avatar, mot de passe, theme et suppression du compte.
- `Conditions` : page des conditions d'utilisation.

## Hooks applicatifs

Les hooks situes dans `src/hooks` regroupent la logique des pages pour garder les composants plus lisibles.

Ils gerent notamment :

- l'authentification et l'inscription ;
- les appels API vers le backend ;
- la navigation dans l'arborescence de fichiers ;
- le televersement et le glisser-deposer ;
- la recherche, le tri et la selection multiple ;
- les partages publics et internes ;
- les parametres du compte utilisateur.

## Interface

L'application utilise React Router pour les routes, Axios pour les appels API, PrimeReact et Lucide React pour certains elements d'interface, Recharts pour les graphiques, ainsi qu'un contexte React pour gerer le theme clair ou sombre.
