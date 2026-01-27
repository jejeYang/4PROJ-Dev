export const PG_CONFIG = {
    host: 'localhost',
    port: 5432,
    database: 'supfile',
    user: 'postgres',
    password: 'root'
};

export const SERVER_FILES_PATH = String.raw`C:\Users\jerem\Documents\4-PROJ_files`;
export const JWT_SECRET = 'your-secret-key'; // À changer en production
export const PORT = process.env.PORT || 3000;
