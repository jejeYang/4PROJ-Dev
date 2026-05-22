# 4PROJ-Dev
Ce projet a été réalisé dans le cadre de module de 4eme année à SUPINFO Tours, par :
- Fournier Cyprien
- Gontier Alex
- Yang Jeremy
- Moreau Killian
- Chuzel-Marmot Alexandre

## Lancer l'application' :
docker compose up --build

## Variables d'environnement :
Définir ces variables d'environnement avant de lancer l'API :

- `GOOGLE_CLIENT_ID` : Client ID OAuth 2.0 (Web) Google
- `JWT_SECRET` : secret de signature JWT

Exemple PowerShell :

```powershell
$env:GOOGLE_CLIENT_ID = "votre-client-id.apps.googleusercontent.com"
$env:JWT_SECRET = "un-secret-fort"
