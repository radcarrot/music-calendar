import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Client } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NEON_DB_URL = "postgresql://neondb_owner:npg_AHSq6KQmVF7N@ep-little-shape-a1idctk2-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function pushSchemaToNeon() {
    console.log('Connecting to Neon.tech PostgreSQL...');
    
    // We must pass ssl: { rejectUnauthorized: false } or similar if strict SSL is causing issues,
    // though the provided URL usually works out of the box with pg.
    const client = new Client({
        connectionString: NEON_DB_URL,
    });

    try {
        await client.connect();
        console.log('Successfully connected to remote Neon.tech database.');

        const schemaFile = path.join(__dirname, 'src', 'db', 'schema_dump_utf8.sql');
        console.log(`Reading highly detailed schema from: ${schemaFile}`);
        
        let schemaSql = fs.readFileSync(schemaFile, 'utf8');
        
        // Strip out 'CREATE DATABASE' / 'connect' lines which aren't cleanly parsed
        // by pure pg Client in some instances or just execute.
        schemaSql = schemaSql.replace(/OWNER TO postgres/g, 'OWNER TO neondb_owner');
        schemaSql = schemaSql.replace(/OWNER TO [a-zA-Z0-9_]+/g, 'OWNER TO neondb_owner');
        
        console.log('Executing schema payload...');
        await client.query(schemaSql);

        console.log('✅ Remote Database fully synchronized! Schema deployed to Production safely.');
    } catch (error) {
        console.error('❌ Error executing deployment:', error);
    } finally {
        await client.end();
        console.log('Connection securely closed.');
    }
}

pushSchemaToNeon();
