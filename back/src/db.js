import pgPromise from 'pg-promise';
import { PG_CONFIG } from './global_properties.js';

const pgp = pgPromise();
export const db = pgp(PG_CONFIG);
