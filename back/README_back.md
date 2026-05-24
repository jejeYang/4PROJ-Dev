# Backend SupFile

Ce dossier contient l'API REST de SupFile. Le backend centralise la logique metier de l'application : authentification, gestion des droits, stockage physique des fichiers, arborescence de dossiers, corbeille, partages et generation de statistiques.

Le backend est lance automatiquement avec la commande Docker depuis la racine du projet :

```bash
docker compose up --build
```

L'API est ensuite disponible sur :

- API : `http://localhost:3000`
- Swagger : `http://localhost:3000/api-docs`
- Specification OpenAPI : `http://localhost:3000/swagger.json`

## Configuration

Les secrets ne doivent pas etre commits. Definir les variables d'environnement avant de lancer l'API en local.

Variables principales :

| Variable | Role |
| --- | --- |
| `DATABASE_URL` | URL de connexion PostgreSQL utilisee par Prisma. |
| `JWT_SECRET` | Secret de signature des tokens JWT. Obligatoire. |
| `GOOGLE_CLIENT_ID` | Client ID OAuth Google pour la connexion Google. Optionnel si OAuth n'est pas utilise. |
| `FILES_PATH` | Chemin du stockage physique des fichiers. |
| `PORT` | Port HTTP de l'API. Par defaut : `3000`. |

Exemple PowerShell :

```powershell
$env:DATABASE_URL = "postgresql://postgres:<mot_de_passe>@localhost:5432/supfile"
$env:GOOGLE_CLIENT_ID = "votre-client-id.apps.googleusercontent.com"
$env:JWT_SECRET = "<secret_jwt_long_et_aleatoire>"
node server.js
```

## Structure principale

```text
back/
|-- prisma/              # Schema Prisma, migrations et seed
|-- src/
|   |-- config/          # Configuration environnement
|   |-- controllers/     # Entrees HTTP des routes Express
|   |-- docs/            # Specification Swagger/OpenAPI
|   |-- jobs/            # Taches planifiees
|   |-- middlewares/     # Authentification, upload, erreurs
|   |-- repositories/    # Acces aux donnees Prisma
|   |-- routes/          # Definition des routes API
|   |-- services/        # Logique metier principale
|   `-- utils/           # Fonctions utilitaires
`-- server.js            # Point d'entree Express
```

## Services applicatifs

Les services sont situes dans `src/services`. Ils portent la logique metier principale et evitent de laisser les controllers gerer directement les regles fonctionnelles.

### `CompteService`

Fichier : `src/services/compte.service.js`

Ce service gere toute la partie identite utilisateur.

Responsabilites principales :

- creation de compte avec validation du nom, de l'email et du mot de passe ;
- hachage des mots de passe avec `bcryptjs` ;
- connexion email / mot de passe ;
- generation et verification des tokens JWT ;
- connexion OAuth Google avec creation automatique du compte local si l'email n'existe pas encore ;
- modification du profil utilisateur ;
- changement de mot de passe ;
- suppression de compte ;
- upload et recuperation de l'avatar utilisateur.

Il s'appuie principalement sur `CompteRepository` pour lire et modifier les donnees en base, et sur `DossierService` pour creer l'espace de stockage initial de l'utilisateur.

### `DossierService`

Fichier : `src/services/dossier.service.js`

Ce service gere l'arborescence, les fichiers et la synchronisation entre la base de donnees et le stockage physique.

Responsabilites principales :

- creation, lecture, renommage, deplacement et suppression de dossiers ;
- construction des chemins physiques a partir de l'arborescence en base ;
- creation du dossier racine utilisateur et du dossier `.corbeille` ;
- upload de fichiers et mise a jour du quota de stockage ;
- listing des fichiers d'un dossier avec taille et date de modification ;
- renommage, deplacement et suppression de fichiers ;
- calcul de taille d'un dossier ;
- statistiques de la page d'accueil : stockage utilise, types de fichiers, plus gros fichiers, fichiers recents et dossiers recents ;
- recherche de fichiers par nom, type et date de modification ;
- gestion de la corbeille avec restauration possible ;
- vidage definitif de la corbeille ;
- copie / partage interne de dossiers entre utilisateurs ;
- generation de noms uniques pour eviter les collisions de fichiers ou dossiers.

Ce service est le coeur fonctionnel de SupFile : il garantit que les actions effectuees dans l'interface correspondent bien a des fichiers presents sur le stockage serveur.

### `LienService`

Fichier : `src/services/lien.service.js`

Ce service gere les liens publics et les informations de partage.

Responsabilites principales :

- creation de liens publics pour fichiers ou dossiers ;
- hachage optionnel du mot de passe associe a un lien public ;
- verification du mot de passe d'un lien protege ;
- recuperation d'un lien depuis son token public ;
- recuperation des liens publics crees par un utilisateur ;
- suppression d'un lien public specifique ;
- suppression des liens lies a un dossier ou a un fichier ;
- suppression des liens expires ;
- recuperation des partages internes envoyes ;
- recuperation des partages internes recus.

Il s'appuie sur `LienRepository` pour les liens publics et sur `DossierRepository` pour retrouver les dossiers partages entre utilisateurs.

## Controllers et repositories

Les controllers recoivent les requetes HTTP, valident les donnees simples, appellent les services, puis renvoient les reponses JSON ou les fichiers.

Les repositories encapsulent les appels Prisma. Ils permettent de garder les services lisibles et de centraliser les requetes vers PostgreSQL.

## Jobs

Le fichier `src/jobs/nettoyage-liens.job.js` lance une tache planifiee qui supprime automatiquement les liens publics expires. Cette tache s'appuie sur `LienService`.

## Securite

- Les routes protegees utilisent le middleware JWT `authentifierToken`.
- Les mots de passe utilisateurs et les mots de passe de liens publics sont hashes.
- Les fichiers sont stockes sur le systeme de fichiers, pas directement en base.
- Les endpoints de dossiers verifient que l'utilisateur authentifie a bien acces au dossier cible.
- Les vrais secrets doivent rester dans un fichier `.env` local non versionne.
