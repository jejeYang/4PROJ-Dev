# 4PROJ-Dev


## Lancer le back se fait automatiquement avec la commande Docker à la racine du projet

## Google Auth (backend)
Définir ces variables d'environnement avant de lancer l'API :

- `GOOGLE_CLIENT_ID` : Client ID OAuth 2.0 (Web) Google
- `JWT_SECRET` : secret de signature JWT

Exemple PowerShell :

```powershell
$env:GOOGLE_CLIENT_ID = "votre-client-id.apps.googleusercontent.com"
$env:JWT_SECRET = "<secret_jwt_long_et_aleatoire>"
node server.js
```
