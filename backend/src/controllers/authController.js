import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 minutes
};

const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/**
 * Register a new user
 */
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long and contain at least one letter and one number.' });
        }

        // Check if user exists
        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate tokens
        const jwtId = Math.random().toString(36).substring(7); // simple unique constraint
        const refreshToken = jwt.sign({ tempId: jwtId }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Insert user
        const sql = `
      INSERT INTO users (name, email, password_hash, refresh_token)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, created_at
    `;
        const result = await query(sql, [name, email, hashedPassword, refreshToken]);
        const user = result.rows[0];

        // Generate access token
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });

        res.cookie('jwt', token, COOKIE_OPTIONS);
        res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

        res.status(201).json({ user });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Login user
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        // Find user
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        // Check if locked
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            return res.status(403).json({ error: 'Account locked due to too many failed attempts. Please try again later.' });
        }

        // Check password
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            let failedAttempts = (user.failed_login_attempts || 0) + 1;
            let lockedUntil = null;
            if (failedAttempts >= 5) {
                lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
                await query('UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3', [failedAttempts, lockedUntil, user.id]);
                return res.status(403).json({ error: 'Account locked due to too many failed attempts. Please try again later.' });
            } else {
                await query('UPDATE users SET failed_login_attempts = $1 WHERE id = $2', [failedAttempts, user.id]);
                return res.status(400).json({ error: 'Invalid credentials' });
            }
        }

        // Reset failed attempts
        if (user.failed_login_attempts > 0 || user.locked_until) {
            await query('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1', [user.id]);
        }

        // Generate tokens
        const refreshToken = jwt.sign({ tempId: Math.random() }, process.env.JWT_SECRET, { expiresIn: '7d' });
        await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });

        // Remove sensitive fields
        delete user.password_hash;
        delete user.failed_login_attempts;
        delete user.locked_until;
        delete user.refresh_token;

        res.cookie('jwt', token, COOKIE_OPTIONS);
        res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

        res.json({ user });
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Refresh token
 */
export const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

        // Verify token
        jwt.verify(refreshToken, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) return res.status(403).json({ error: 'Invalid refresh token' });

            // Check if user has this token
            const result = await query('SELECT * FROM users WHERE refresh_token = $1', [refreshToken]);
            const user = result.rows[0];

            if (!user) return res.status(403).json({ error: 'Invalid refresh token' });

            // Issue new access token
            const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
            res.cookie('jwt', token, COOKIE_OPTIONS);
            res.status(200).json({ message: 'Token refreshed' });
        });
    } catch (err) {
        console.error('Error refreshing token:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Logout
 */
export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            await query('UPDATE users SET refresh_token = NULL WHERE refresh_token = $1', [refreshToken]);
        }
        res.clearCookie('jwt');
        res.clearCookie('refreshToken');
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Error logging out:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get current user
 */
export const me = async (req, res) => {
    try {
        const result = await query('SELECT id, name, email, created_at FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.sendStatus(404);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching me:', err);
        res.sendStatus(500);
    }
};
