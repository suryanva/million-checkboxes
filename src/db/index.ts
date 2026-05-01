import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing from .env file');
}

const sql = neon(process.env.DATABASE_URL);

// Pass the schema to drizzle so you get autocomplete for relational queries
export const db = drizzle(sql, { schema });