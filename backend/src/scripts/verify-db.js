// backend/src/scripts/verify-db.js
import { query } from '../config/database.js';

const verify = async () => {
    try {
        const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'artists';
    `);

        if (result.rows.length > 0) {
            console.log('✅ Success: Artists table exists.');
        } else {
            console.error('❌ Error: Artists table NOT found.');
            process.exit(1);
        }
        process.exit(0);
    } catch (err) {
        console.error('Error verifying database:', err);
        process.exit(1);
    }
};

verify();
