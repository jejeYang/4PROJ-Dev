export const PG_CONFIG = {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT) || 5432,
    database: process.env.PG_DATABASE || 'supfile',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'user'
};

export const SERVER_FILES_PATH = process.env.FILES_PATH || './files';
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
export const PORT = process.env.PORT || 3000;