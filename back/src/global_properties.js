export const PG_CONFIG = {
    host: 'localhost',
    port: 5433, /*ATTENTION Modifié temporairement pour Alex car mon postgresql est sur ce port. Remplacez ça par 5432 si vous utilisez ma branche*/
    database: 'supfile',
    user: 'postgres',
    password: 'root'
};

export const SERVER_FILES_PATH = String.raw`C:\Users\ED\Documents\4EME_ANNEE\4Projet\4-PROJ_files`;
export const JWT_SECRET = 'your-secret-key'; // À changer en production
export const PORT = process.env.PORT || 3000;
