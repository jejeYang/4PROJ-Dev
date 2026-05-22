# 4PROJ-Dev


## Lancer le front :
cd front
npm run dev

## Google Auth (frontend)
Définir la variable d'environnement Vite avant de lancer le front :

- `VITE_GOOGLE_CLIENT_ID` : même Client ID OAuth 2.0 (Web) que le backend

Exemple PowerShell :

```powershell
$env:VITE_GOOGLE_CLIENT_ID = "votre-client-id.apps.googleusercontent.com"
npm run dev
```



http://localhost:5173