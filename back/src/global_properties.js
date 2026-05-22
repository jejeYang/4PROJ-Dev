export const PG_CONFIG = {
    host: process.env.PG_HOST || 'localhost',
    port: Number.parseInt(process.env.PG_PORT, 10) || 5432,
    database: process.env.PG_DATABASE || 'supfile',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || ''
};

export const SERVER_FILES_PATH = process.env.FILES_PATH || './files';
export const JWT_SECRET = process.env.JWT_SECRET;
export const PORT = process.env.PORT || 3000;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET doit etre defini dans les variables d environnement.');
}
