import { query } from './src/config/database.js';

async function migrate() {
    try {
        console.log('Adding failed_login_attempts column...');
        await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0');

        console.log('Adding locked_until column...');
        await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP');

        console.log('Adding refresh_token column...');
        await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token TEXT');

        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

migrate();
