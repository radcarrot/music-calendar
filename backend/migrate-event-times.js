import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function migrate() {
    const client = await pool.connect();
    try {
        // Add time columns to events table
        await client.query(`
            ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time TIME;
        `);
        await client.query(`
            ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time TIME;
        `);
        console.log('✅ Added start_time and end_time columns to events table');
    } catch (err) {
        console.error('Migration error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
