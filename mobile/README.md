# 4PROJ-Dev


## Lancer l'app mobile :
cd mobile
npm start 

## Prérequis 
Avoir Expo go sur son telephone et mettre l'ip de votre ordi dans l'ip de config.ts 
(ex : export const API_BASE_URL = 'http://192.168.x.x:3000';)

## Remarque
Dans le back, server.js 
Changement de la ligne : res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');

Par :
res.setHeader('Access-Control-Allow-Origin', '*'); 

Permet de ne plus bloquer l'application mobile (en développement) pour se connecter au back 
Devra être changer (en production) pour n'accepter que le site web et l'app mobile