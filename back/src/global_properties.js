export const PG_CONFIG = {
    host: process.env.PG_HOST || 'localhost',
    port: Number.parseInt(process.env.PG_PORT, 10) || 5432,
    database: process.env.PG_DATABASE || 'supfile',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'user'
};

export const SERVER_FILES_PATH = process.env.FILES_PATH || './files';
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
export const PORT = process.env.PORT || 3000;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '60122681226-56ehoh7uj46u1ot03dlct24srh1j83p0.apps.googleusercontent.com';