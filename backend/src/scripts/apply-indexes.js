import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const applyIndexes = async () => {
    try {
        const sqlPath = path.join(__dirname, '../db/add_indexes.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Applying database indexes for performance...');
        await query(sql);
        console.log('Database indexes successfully added!');
        process.exit(0);
    } catch (err) {
        console.error('Error applying indexes:', err);
        process.exit(1);
    }
};

applyIndexes();
