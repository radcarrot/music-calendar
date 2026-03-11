import pool from './src/config/database.js';

async function migrate() {
    console.log('Starting profile picture migration...');
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Add profile_image_url column if it doesn't exist
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(255);
        `);

        await client.query('COMMIT');
        console.log('✅ Migration successful! Added profile_image_url column.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
