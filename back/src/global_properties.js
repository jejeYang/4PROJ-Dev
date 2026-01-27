export const PG_CONFIG = {
    host: 'localhost',
    port: 5432, /*ATTENTION Modifié temporairement pour Alex car mon postgresql est sur ce port. Remplacez ça par 5432 si vous utilisez ma branche*/
    database: 'supfile',
    user: 'postgres',
    password: 'user'
};

export const SERVER_FILES_PATH = String.raw`C:\Users\jerem\Documents\4-PROJ_files`;
export const JWT_SECRET = 'your-secret-key'; // À changer en production
export const PORT = process.env.PORT || 3000;
