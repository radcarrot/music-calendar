import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async () => {
    console.log('\n--- Jest Global Setup: Initializing Test Database ---');
    const config = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: 'postgres' // Connect to default DB to drop/create
    };

    const sysPool = new Pool(config);
    const dbName = `${process.env.DB_NAME || 'music_calendar'}_test`;

    try {
        const res = await sysPool.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = $1`, [dbName]);
        if (res.rowCount > 0) {
            console.log(`Dropping existing database: ${dbName}...`);
            await sysPool.query(`DROP DATABASE ${dbName} WITH (FORCE);`);
        }
        console.log(`Creating fresh database: ${dbName}...`);
        await sysPool.query(`CREATE DATABASE ${dbName};`);
    } catch (err) {
        console.error('Test DB creation failed:', err);
    } finally {
        await sysPool.end();
    }

    console.log(`Running schema migration on ${dbName}...`);
    const testPool = new Pool({ ...config, database: dbName });
    const schemaPath = path.join(__dirname, '../db/schema_dump_utf8.sql');
    
    try {
        let schemaSql = fs.readFileSync(schemaPath, 'utf8');
        // Remove psql internal macros starting with backslash (like \restrict)
        schemaSql = schemaSql.replace(/^\\.*$/gm, '');
        
        await testPool.query(schemaSql);
        console.log('Base schema executed.');
    } catch (err) {
        console.error('Test DB Schema run failed:', err);
    } finally {
        await testPool.end();
    }
};
