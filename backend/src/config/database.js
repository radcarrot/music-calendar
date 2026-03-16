// backend/src/config/database.js
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';
const dbName = process.env.DB_NAME || 'music_calendar';

console.log('--- DB INIT ---');
console.log('DATABASE_URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 'UNDEFINED');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('---------------');

const pool = new Pool(
  process.env.DATABASE_URL 
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || 5432),
        database: isTest ? `${dbName}_test` : dbName,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        max: 10,
      }
);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PG client', err);
  process.exit(-1);
});

/**
 * Simple query helper
 * Usage: const res = await query('SELECT * FROM artists WHERE id=$1', [id]);
 */
export async function query(text, params = []) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // uncomment to debug slow queries:
  // console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
}

export default pool;
