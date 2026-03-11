import request from 'supertest';
import app from '../../server.js';
import { Pool } from 'pg';
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

describe('Auth API Routes', () => {
    // Teardown the DB connection and clean out tables
    afterAll(async () => {
        await pool.query('DELETE FROM users;');
        await pool.end();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user with valid inputs', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test Setup User',
                    email: 'testauth@example.com',
                    password: 'password123'
                });
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('email', 'testauth@example.com');
        });

        it('should fail with invalid email', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test Setup User',
                    email: 'not-an-email',
                    password: 'password123'
                });
            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toEqual('Validation failed');
            expect(res.body.details[0].msg).toEqual('Valid email required');
        });

        it('should fail if password is too short', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test Setup User',
                    email: 'testauth2@example.com',
                    password: 'short'
                });
            expect(res.statusCode).toEqual(400);
            expect(res.body.details[0].msg).toEqual('Password too short');
        });
        
        it('should block duplicate email registration', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Duplicate',
                    email: 'testauth@example.com',
                    password: 'password123'
                });
            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toEqual('User already exists');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login an existing user', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'testauth@example.com',
                    password: 'password123'
                });
            expect(res.statusCode).toEqual(200);
            expect(res.body.user).toHaveProperty('email', 'testauth@example.com');
            expect(res.headers['set-cookie']).toBeDefined(); // Should set JWT httpOnly cookie
        });

        it('should fail login with wrong password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'testauth@example.com',
                    password: 'wrongpassword'
                });
            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toEqual('Invalid credentials');
        });
        
        it('should fail login with non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nobody@example.com',
                    password: 'password123'
                });
            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toEqual('Invalid credentials');
        });
    });
});
