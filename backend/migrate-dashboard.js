import { query } from './src/config/database.js';

async function migrate() {
    try {
        console.log('Adding Google OAuth columns to users table...');
        await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS google_access_token TEXT');
        await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS google_refresh_token TEXT');
        await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS google_token_expiry BIGINT');

        console.log('Creating user_artists table...');
        await query(`
            CREATE TABLE IF NOT EXISTS user_artists (
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
                PRIMARY KEY (user_id, artist_id)
            )
        `);

        console.log('Creating events table...');
        await query(`
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                event_date TIMESTAMP NOT NULL,
                description TEXT,
                category VARCHAR(50),
                external_url TEXT,
                google_calendar_event_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Creating event_artists table...');
        await query(`
            CREATE TABLE IF NOT EXISTS event_artists (
                event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
                artist_id INTEGER REFERENCES artists(id) ON DELETE CASCADE,
                PRIMARY KEY (event_id, artist_id)
            )
        `);

        console.log('Dashboard migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

migrate();
