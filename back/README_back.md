# 4PROJ-Dev


## Lancer le back :
cd back
docker compose up --build

## Google Auth (backend)
Définir ces variables d'environnement avant de lancer l'API :

- `GOOGLE_CLIENT_ID` : Client ID OAuth 2.0 (Web) Google
- `JWT_SECRET` : secret de signature JWT

Exemple PowerShell :

```powershell
$env:GOOGLE_CLIENT_ID = "votre-client-id.apps.googleusercontent.com"
$env:JWT_SECRET = "un-secret-fort"
node server.js
```

Route ajoutée :

- `POST /api/auth/google` avec body `{ "idToken": "<credential_google>" }`