import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PORT = process.env.PORT || 3000;
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const PG_CONFIG = {
  host: process.env.PG_HOST || 'localhost',
  port: Number.parseInt(process.env.PG_PORT, 10) || 5432,
  database: process.env.PG_DATABASE || 'supfile',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'user'
};

// Default storage path: back/storage/files
export const SERVER_FILES_PATH = process.env.FILES_PATH || path.join(__dirname, '../../storage/files');

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '60122681226-56ehoh7uj46u1ot03dlct24srh1j83p0.apps.googleusercontent.com';

export default {
  PORT,
  JWT_SECRET,
  PG_CONFIG,
  SERVER_FILES_PATH,
  GOOGLE_CLIENT_ID
};
