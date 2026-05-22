# SupFile

SupFile est une application de gestion, stockage et partage de fichiers développée dans le cadre d'un projet de 4e année à SUPINFO Tours.

Le projet propose une plateforme complète avec une application web, une API REST, une base PostgreSQL et une application mobile Expo. Les utilisateurs peuvent créer un compte, organiser leurs fichiers par dossiers, téléverser des documents, gérer une corbeille, partager des dossiers avec d'autres utilisateurs et générer des liens publics protégés.

## Équipe projet

- Cyprien Fournier
- Alex Gontier
- Jeremy Yang
- Killian Moreau
- Alexandre Chuzel-Marmot

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Technologies](#technologies)
- [Prérequis](#prérequis)
- [Démarrage rapide avec Docker](#démarrage-rapide-avec-docker)
- [Installation locale](#installation-locale)
- [Variables d'environnement](#variables-denvironnement)
- [Documentation API Swagger](#documentation-api-swagger)
- [Application mobile](#application-mobile)
- [Structure du projet](#structure-du-projet)
- [Scripts utiles](#scripts-utiles)
- [Base de données](#base-de-données)
- [Comptes de démonstration](#comptes-de-démonstration)
- [Notes de développement](#notes-de-développement)

## Fonctionnalités

- Authentification par email et mot de passe.
- Authentification Google OAuth.
- Création, modification et suppression de compte.
- Mise à jour du profil utilisateur et de l'avatar.
- Création, renommage, déplacement et suppression de dossiers.
- Téléversement simple et multiple de fichiers.
- Visualisation et téléchargement de fichiers.
- Téléchargement d'une sélection de fichiers ou dossiers au format ZIP.
- Recherche de fichiers par nom et par type.
- Gestion d'une corbeille avec restauration ou suppression définitive.
- Partage interne de dossiers entre utilisateurs.
- Génération de liens publics de partage.
- Protection optionnelle des liens publics par mot de passe.
- Expiration automatique des liens publics.
- Documentation API interactive avec Swagger UI.
- Interface web responsive.
- Application mobile Expo pour Android, iOS et web.

## Architecture

Le projet est organisé en trois applications principales :

- `back` : API REST Express, Prisma, PostgreSQL, gestion des fichiers et documentation Swagger.
- `front` : application web React avec Vite.
- `mobile` : application mobile Expo / React Native.

Les services Docker lancent :

- PostgreSQL sur `localhost:5432`.
- API backend sur `localhost:3000`.
- Frontend web sur `localhost:5173`.

## Technologies

### Backend

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- JSON Web Token
- Bcrypt
- Multer
- Archiver
- Node-cron
- Swagger UI Express

### Frontend web

- React
- Vite
- React Router
- Axios
- Lucide React
- PrimeReact
- Recharts

### Mobile

- Expo
- React Native
- TypeScript
- Axios
- React Navigation
- Expo Document Picker
- Expo Image Picker
- Expo File System

### Infrastructure

- Docker
- Docker Compose
- PostgreSQL 16 Alpine

## Prérequis

Pour lancer le projet avec Docker :

- Docker
- Docker Compose

Pour un lancement local sans Docker :

- Node.js 22 recommandé
- npm
- PostgreSQL
- Expo Go pour tester l'application mobile sur téléphone

## Démarrage rapide avec Docker

Depuis la racine du projet :

```bash
docker compose up --build
```

Cette commande construit et démarre les services suivants :

- API : [http://localhost:3000](http://localhost:3000)
- Swagger : [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- Frontend : [http://localhost:5173](http://localhost:5173)
- PostgreSQL : `localhost:5432`

Pour arrêter les conteneurs :

```bash
docker compose down
```

Pour supprimer aussi le volume PostgreSQL :

```bash
docker compose down -v
```

## Installation locale

### 1. Installer les dépendances backend

```bash
cd back
npm install
```

### 2. Configurer la base de données

Créer une base PostgreSQL nommée `supfile`, puis définir la variable `DATABASE_URL`.

Exemple :

```bash
export DATABASE_URL="postgresql://postgres:root@localhost:5432/supfile"
```

### 3. Initialiser Prisma

```bash
cd back
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 4. Lancer le backend

```bash
cd back
npm start
```

Le backend démarre sur [http://localhost:3000](http://localhost:3000).

### 5. Installer et lancer le frontend

```bash
cd front
npm install
npm run dev
```

Le frontend démarre sur [http://localhost:5173](http://localhost:5173).

### 6. Installer et lancer le mobile

```bash
cd mobile
npm install
npm start
```

Scanner ensuite le QR code avec Expo Go ou ouvrir l'application depuis un simulateur.

## Variables d'environnement

### Backend

| Variable | Description | Valeur par défaut |
| --- | --- | --- |
| `PORT` | Port d'écoute de l'API | `3000` |
| `DATABASE_URL` | URL de connexion PostgreSQL utilisée par Prisma | Requise hors Docker |
| `FILES_PATH` | Chemin de stockage physique des fichiers | `back/storage/files` |
| `JWT_SECRET` | Secret de signature des tokens JWT | `your-secret-key` |
| `GOOGLE_CLIENT_ID` | Client ID OAuth 2.0 Google | Client ID de développement |
| `PG_HOST` | Hôte PostgreSQL utilisé par la config interne | `localhost` |
| `PG_PORT` | Port PostgreSQL | `5432` |
| `PG_DATABASE` | Nom de la base | `supfile` |
| `PG_USER` | Utilisateur PostgreSQL | `postgres` |
| `PG_PASSWORD` | Mot de passe PostgreSQL | `user` |

Exemple PowerShell :

```powershell
$env:DATABASE_URL = "postgresql://postgres:root@localhost:5432/supfile"
$env:GOOGLE_CLIENT_ID = "votre-client-id.apps.googleusercontent.com"
$env:JWT_SECRET = "un-secret-fort"
```

### Frontend

| Variable | Description |
| --- | --- |
| `VITE_GOOGLE_CLIENT_ID` | Client ID OAuth Google utilisé par l'application web |

Exemple PowerShell :

```powershell
$env:VITE_GOOGLE_CLIENT_ID = "votre-client-id.apps.googleusercontent.com"
npm run dev
```

### Mobile

L'application mobile utilise l'URL déclarée dans :

```text
mobile/src/config.ts
```

Remplacer `API_BASE_URL` par l'adresse IP locale de la machine qui exécute le backend :

```ts
export const API_BASE_URL = 'http://192.168.x.x:3000';
```

Le téléphone et l'ordinateur doivent être connectés au même réseau.

## Documentation API Swagger

Une documentation OpenAPI est disponible côté backend :

- Interface Swagger UI : [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- Spécification JSON : [http://localhost:3000/swagger.json](http://localhost:3000/swagger.json)

La documentation couvre notamment :

- Authentification
- Gestion des utilisateurs
- Dossiers
- Fichiers
- Corbeille
- Partages internes
- Liens publics

Les routes protégées utilisent un token JWT au format :

```http
Authorization: Bearer <token>
```

Les liens publics protégés peuvent recevoir le mot de passe via :

```http
x-lien-password: <mot-de-passe>
```

ou via le paramètre de requête `password`.

## Application mobile

L'application mobile se trouve dans le dossier `mobile`.

Prérequis :

- Installer Expo Go sur le téléphone.
- Vérifier que la version Expo utilisée est compatible avec le projet.
- Mettre à jour `mobile/src/config.ts` avec l'IP locale du backend.
- Connecter le téléphone et l'ordinateur au même réseau.

Lancement :

```bash
cd mobile
npm start
```

Commandes disponibles :

```bash
npm run android
npm run ios
npm run web
```

## Structure du projet

```text
.
├── back
│   ├── prisma
│   │   ├── migrations
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── docs
│   │   ├── dto
│   │   ├── jobs
│   │   ├── metier
│   │   ├── middlewares
│   │   ├── repositories
│   │   ├── routes
│   │   ├── services
│   │   └── utils
│   ├── Dockerfile
│   └── server.js
├── front
│   ├── public
│   ├── src
│   │   ├── assets
│   │   ├── components
│   │   ├── context
│   │   ├── hooks
│   │   ├── pages
│   │   ├── styles
│   │   └── utils
│   ├── Dockerfile
│   └── vite.config.js
├── mobile
│   ├── src
│   │   ├── api
│   │   ├── assets
│   │   ├── components
│   │   ├── config.ts
│   │   ├── context
│   │   ├── navigation
│   │   └── screens
│   └── App.tsx
├── docker-compose.yml
└── README.md
```

## Scripts utiles

### Backend

```bash
cd back
npm start
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### Frontend

```bash
cd front
npm run dev
npm run build
npm run lint
npm run preview
```

### Mobile

```bash
cd mobile
npm start
npm run android
npm run ios
npm run web
```

## Base de données

Le backend utilise Prisma avec PostgreSQL.

Les modèles principaux sont :

- `Compte` : utilisateurs, email, mot de passe hashé, stockage et avatar.
- `Dossier` : arborescence de dossiers, propriétaire, partage interne et corbeille.
- `LienGenere` : liens publics, expiration, mot de passe optionnel et token public.

Avec Docker, les migrations Prisma et le seed sont exécutés automatiquement au démarrage du conteneur backend.

Sans Docker, exécuter :

```bash
cd back
npm run prisma:migrate
npm run prisma:seed
```

## Comptes de démonstration

Le seed crée des comptes de test :

| Email | Rôle |
| --- | --- |
| `admin@supfile.com` | Administrateur de démonstration |
| `user@test.com` | Utilisateur de démonstration |

Les mots de passe sont hashés dans le seed. Si besoin, les modifier directement dans `back/prisma/seed.js` puis relancer :

```bash
cd back
npm run prisma:seed
```

## Notes de développement

- Les fichiers utilisateurs sont stockés physiquement dans `back/storage/files` en local.
- En Docker, ce dossier est monté dans le conteneur backend sur `/app/files`.
- La corbeille repose sur un dossier spécial `.corbeille`.
- Un job planifié supprime les liens publics expirés chaque nuit.
- Les tests automatisés ne sont pas encore configurés dans le projet.
- Pour la production, remplacer les secrets par des valeurs sécurisées et ne pas conserver les valeurs de développement du `docker-compose.yml`.

## Licence

Projet académique réalisé à SUPINFO Tours.
