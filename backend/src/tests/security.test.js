import request from 'supertest';
import express from 'express';
import server from '../../server.js';
import pool from '../config/database.js';

describe('OWASP Mitigation Tests', () => {

    // 1. Test XSS Sanitization
    it('should sanitize XSS payloads in registration', async () => {
        const payload = {
            name: '<script>alert("xss")</script>BadGuy',
            email: 'xss_tester@example.com',
            password: 'Password123!'
        };

        const res = await request(server)
            .post('/api/auth/register')
            .send(payload);

        // It might return 201 or 400 depending on if user exists, 
        // but the core check is that the DB doesn't store the raw script tag,
        // or the API rejects it/escapes it.
        // If it succeeds and returns the parsed user object, the name must be escaped.
        if (res.status === 201) {
            expect(res.body.user.name).not.toContain('<script>');
            expect(res.body.user.name).toContain('&lt;script&gt;');
        }
    });

    // 2. Test SQL Injection Protection
    it('should not allow SQL logic payloads to bypass authentication', async () => {
        const sqliPayload = {
            email: "admin@example.com' OR '1'='1",
            password: "password"
        };

        const res = await request(server)
            .post('/api/auth/login')
            .send(sqliPayload);

        // Should be caught by validation (400) or at least blocked (429/403)
        // We verify it's NOT a 201 or 500
        expect([400, 429, 403]).toContain(res.status);
        if (res.status === 400) {
            expect(['Invalid credentials', 'Validation failed']).toContain(res.body.error);
        }
    });

    // 3. Test Rate Limiting / Brute Force Protection
    it('should lock out an account after several failed login attempts', async () => {
        const payload = {
            email: `brute_${Date.now()}@example.com`,
            password: 'WrongPassword123'
        };

        let wasLocked = false;
        for (let i = 0; i < 7; i++) {
            const res = await request(server).post('/api/auth/login').send(payload);
            if (res.status === 429 || res.status === 403) {
                wasLocked = true;
                break;
            }
        }
        expect(wasLocked).toBe(true);
    });

    afterAll(async () => {
        await pool.end();
    });
});
