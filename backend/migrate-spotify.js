import { query } from './src/config/database.js';

async function migrate() {
    try {
        console.log('Adding Spotify OAuth columns to users table...');
        await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_access_token TEXT');
        await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_refresh_token TEXT');
        await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS spotify_token_expiry BIGINT');

        console.log('Spotify migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

migrate();
