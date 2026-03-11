import request from 'supertest';
import app from '../../server.js';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const dbName = `${process.env.DB_NAME || 'music_calendar'}_test`;
const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    database: dbName,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
});

describe('Events API Routes & SQLi Protection', () => {
    let testUserId;
    let authCookie;
    let createdEventId;

    beforeAll(async () => {
        // Create a test user directly in DB
        const result = await pool.query(`
            INSERT INTO users (name, email, password_hash)
            VALUES ('Event Tester', 'event-tester@example.com', 'hashed')
            RETURNING id, email
        `);
        testUserId = result.rows[0].id;
        
        // Generate valid JWT to bypass real login overhead
        const token = jwt.sign(
            { id: testUserId, email: result.rows[0].email }, 
            process.env.JWT_SECRET || 'secret123', 
            { expiresIn: '15m' }
        );
        authCookie = `jwt=${token}`;
    });

    afterAll(async () => {
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
        await pool.end();
    });

    describe('POST /api/events', () => {
        it('should block unauthenticated creation', async () => {
            const res = await request(app).post('/api/events').send({ title: 'Anon', event_date: '2026-10-10' });
            expect(res.statusCode).toEqual(401);
        });

        it('should successfully create an event when authenticated', async () => {
            const res = await request(app)
                .post('/api/events')
                .set('Cookie', authCookie)
                .send({
                    title: 'My First Test Concert',
                    event_date: '2026-10-15',
                    description: 'Testing the events API endpoints',
                    category: 'Concert',
                    sync_to_google: false // Prevent external side effects
                });
            
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('id');
            expect(res.body.title).toEqual('My First Test Concert');
            createdEventId = res.body.id;
        });

        it('should mitigate SQL injection payloads in title/description', async () => {
             // Testing standard SQLi payloads
             const sqliPayload = "Robert'; DROP TABLE events; --";
             
             const res = await request(app)
                 .post('/api/events')
                 .set('Cookie', authCookie)
                 .send({
                     title: sqliPayload,
                     event_date: '2026-10-16',
                     description: 'Normal Description',
                     sync_to_google: false
                 });
             
             expect(res.statusCode).toEqual(201); // Created, but payload treated as literal string
             
             // Verify the DB was NOT dropped and the payload is raw string
             const checkRes = await pool.query('SELECT title FROM events WHERE id = $1', [res.body.id]);
             // Wait, Express-Validator has .escape() on title! It will be HTML escaped!
             const expectedEscaped = "Robert&#x27;; DROP TABLE events; --";
             expect(checkRes.rows[0].title).toEqual(expectedEscaped);
             
             // Cleanup the injection test event
             await pool.query('DELETE FROM events WHERE id = $1', [res.body.id]);
        });
    });

    describe('GET /api/events', () => {
        it('should fetch the users events', async () => {
            const res = await request(app)
                .get('/api/events')
                .set('Cookie', authCookie);
            
            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toBeGreaterThanOrEqual(1);
            expect(res.body[0].title).toEqual('My First Test Concert');
        });
    });

    describe('DELETE /api/events/:id', () => {
        it('should delete an event that belongs to the user', async () => {
            const res = await request(app)
                .delete(`/api/events/${createdEventId}`)
                .set('Cookie', authCookie);
            
            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toEqual('Event deleted successfully');
        });
        
        it('should return 404 for an already deleted event', async () => {
            const res = await request(app)
                .delete(`/api/events/${createdEventId}`)
                .set('Cookie', authCookie);
            
            expect(res.statusCode).toEqual(404);
            expect(res.body.error).toEqual('Event not found or you do not have permission to delete it');
        });
    });
});
