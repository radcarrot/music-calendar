import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import crypto from 'crypto';
import { encrypt } from '../utils/crypto.js';
import { getGoogleClient } from '../services/googleCalendar.js';
import { google } from 'googleapis';
import axios from 'axios';
import qs from 'qs';

const getSpotifyRedirectUri = () => `${process.env.BACKEND_URL}/api/auth/spotify/callback`;

const isProduction = process.env.NODE_ENV === 'production';

// Use an HTML redirect page instead of res.redirect() so that Vercel's proxy
// doesn't strip Set-Cookie headers (which it does on 302 responses).
// Uses meta-refresh (not inline JS) so Helmet's CSP doesn't block it.
const htmlRedirect = (url) => {
    const safeUrl = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    return `<!DOCTYPE html><html><head><meta charset="utf-8">` +
        `<meta http-equiv="refresh" content="0; url=${safeUrl}">` +
        `</head><body></body></html>`;
};

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000 // 15 minutes
};

const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
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
        const jwtId = crypto.randomBytes(16).toString('hex');
        const refreshToken = jwt.sign({ tempId: jwtId }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Insert user
        const sql = `
      INSERT INTO users (name, email, password_hash, refresh_token)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, profile_image_url, created_at
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
        const refreshToken = jwt.sign({ tempId: crypto.randomBytes(16).toString('hex') }, process.env.JWT_SECRET, { expiresIn: '7d' });
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
        const result = await query('SELECT id, name, email, profile_image_url, google_access_token IS NOT NULL as google_linked, created_at FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.sendStatus(404);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching me:', err);
        res.sendStatus(500);
    }
};

/**
 * Initiate Google OAuth Flow
 */
export const googleAuth = (req, res) => {
    const oauth2Client = getGoogleClient();

    // Generate a secure random state string
    const state = crypto.randomBytes(32).toString('hex');
    res.cookie('oauth_state', state, { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax', maxAge: 15 * 60 * 1000 });

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Requests refresh_token
        scope: [
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ],
        state: state,
        prompt: 'consent'
    });

    res.send(htmlRedirect(url));
};

/**
 * Handle Google OAuth Callback
 */
export const googleCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        const savedState = req.cookies.oauth_state;

        console.log('[Google] Callback hit');
        console.log('[Google] state from URL:', state ? state.substring(0, 8) + '...' : 'MISSING');
        console.log('[Google] oauth_state cookie:', savedState ? savedState.substring(0, 8) + '...' : 'MISSING');
        console.log('[Google] all cookie keys:', Object.keys(req.cookies));

        // CSRF verification
        if (!state || state !== savedState) {
            console.error('[Google] State mismatch! URL state:', !!state, 'Cookie state:', !!savedState);
            return res.status(403).json({ error: 'Invalid state parameter' });
        }
        res.clearCookie('oauth_state');

        if (!code) {
            return res.status(400).json({ error: 'Missing authorization code' });
        }

        const oauth2Client = getGoogleClient();
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Fetch User Profile from Google
        const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
        const userInfo = await oauth2.userinfo.get();
        const { email, name: googleName, picture: googlePicture } = userInfo.data;

        // Encrypt refresh token (defensively in case Google omits it on recurring logins)
        const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;

        // SCENARIO 1: User is already logged in (Linking Account)
        let userId;

        // We need to manually verify the JWT since authenticateToken isn't forced on this route anymore
        const token = req.cookies.jwt;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;

                // Link Google credentials to existing account
                await query('UPDATE users SET google_access_token = $1, google_refresh_token = $2, google_token_expiry = $3 WHERE id = $4', [
                    tokens.access_token || null,
                    encryptedRefreshToken || null,
                    tokens.expiry_date || null,
                    userId
                ]);
                return res.send(htmlRedirect(`${process.env.FRONTEND_URL}/dashboard?google_sync=success`));
            } catch (err) {
                // Token invalid/expired, fall through to login/register flow
                console.log('JWT invalid during Google sync, proceeding to login flow');
            }
        }

        // SCENARIO 2: Google Sign-In (Login or Register)

        // 2a. Check if a user with this email already exists
        let userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
        let user = userResult.rows[0];

        if (!user) {
            // 2b. Auto-Register new user
            const randomPassword = crypto.randomBytes(16).toString('hex'); // Give them an impossibly long random password since they use Google
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            // Generate standard refresh token
            const stdRefreshToken = jwt.sign({ tempId: crypto.randomBytes(16).toString('hex') }, process.env.JWT_SECRET, { expiresIn: '7d' });

            const insertSql = `
                INSERT INTO users (name, email, password_hash, refresh_token, google_access_token, google_refresh_token, google_token_expiry, profile_image_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, name, email
            `;
            const insertResult = await query(insertSql, [
                googleName || null,
                email,
                hashedPassword,
                stdRefreshToken,
                tokens.access_token || null,
                encryptedRefreshToken || null,
                tokens.expiry_date || null,
                googlePicture || null
            ]);
            user = insertResult.rows[0];
            user.refresh_token = stdRefreshToken;
        } else {
            // 2c. Log them in, but still update their Google tokens since they just authenticated
            await query('UPDATE users SET google_access_token = $1, google_refresh_token = COALESCE($2, google_refresh_token), google_token_expiry = $3, profile_image_url = COALESCE(profile_image_url, $5) WHERE id = $4', [
                tokens.access_token || null,
                encryptedRefreshToken || null,
                tokens.expiry_date || null,
                user.id,
                googlePicture || null
            ]);

            // Need a new standard refresh token
            user.refresh_token = jwt.sign({ tempId: crypto.randomBytes(16).toString('hex') }, process.env.JWT_SECRET, { expiresIn: '7d' });
            await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [user.refresh_token, user.id]);
        }

        // Issue their login cookies
        const jwtToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
        res.cookie('jwt', jwtToken, COOKIE_OPTIONS);
        res.cookie('refreshToken', user.refresh_token, REFRESH_COOKIE_OPTIONS);

        res.send(htmlRedirect(`${process.env.FRONTEND_URL}/dashboard?login=success`));
    } catch (err) {
        console.error('Google Auth Callback Error:', err);
        res.send(htmlRedirect(`${process.env.FRONTEND_URL}/dashboard?google_sync=error`));
    }
};

/**
 * Initiate Spotify OAuth Flow
 */
export const spotifyAuth = (req, res) => {
    const scope = 'user-read-private user-read-email user-top-read';
    const state = crypto.randomBytes(16).toString('hex');
    res.cookie('spotify_auth_state', state, COOKIE_OPTIONS);

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope: scope,
        redirect_uri: getSpotifyRedirectUri(),
        state: state,
        show_dialog: 'true'
    });

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    console.log('[Spotify] Redirecting to:', authUrl);
    res.send(htmlRedirect(authUrl));
};

/**
 * Handle Spotify OAuth Callback
 */
export const spotifyCallback = async (req, res) => {
    console.log('[Spotify] Callback hit');
    console.log('[Spotify] Query params:', JSON.stringify(req.query));

    try {
        const code = req.query.code || null;
        const state = req.query.state || null;
        const storedState = req.cookies?.spotify_auth_state || null;

        if (state === null || state !== storedState) {
            console.log('[Spotify] State mismatch:', { state, storedState });
            return res.send(htmlRedirect(`${process.env.FRONTEND_URL}/login?error=state_mismatch`));
        }

        res.clearCookie('spotify_auth_state');

        if (!code) {
            return res.send(htmlRedirect(`${process.env.FRONTEND_URL}/login?error=missing_code`));
        }

        // Exchange authorization code for tokens
        const tokenData = qs.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: getSpotifyRedirectUri()
        });

        console.log('[Spotify] Exchanging code for tokens...');
        console.log('[Spotify] redirect_uri:', getSpotifyRedirectUri());

        const tokenResponse = await axios({
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            data: tokenData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(
                    process.env.SPOTIFY_CLIENT_ID.trim() + ':' + process.env.SPOTIFY_CLIENT_SECRET.trim()
                ).toString('base64')
            }
        });

        const tokens = tokenResponse.data;
        console.log('[Spotify] Token exchange successful! Access token received.');

        // Fetch User Profile from Spotify
        const userResponse = await axios.get('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': 'Bearer ' + tokens.access_token }
        });
        const userInfo = userResponse.data;
        console.log('[Spotify] User profile fetched:', userInfo.email);

        const email = userInfo.email;
        const spotifyName = userInfo.display_name;

        // Encrypt refresh token
        const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;
        const expiryDate = Date.now() + tokens.expires_in * 1000;

        // SCENARIO 1: User is already logged in (Linking Account)
        let userId;
        const jwtCookie = req.cookies.jwt;
        if (jwtCookie) {
            try {
                const decoded = jwt.verify(jwtCookie, process.env.JWT_SECRET);
                userId = decoded.id;

                await query('UPDATE users SET spotify_access_token = $1, spotify_refresh_token = COALESCE($2, spotify_refresh_token), spotify_token_expiry = $3 WHERE id = $4', [
                    tokens.access_token || null,
                    encryptedRefreshToken || null,
                    expiryDate || null,
                    userId
                ]);
                console.log('[Spotify] Linked to existing user:', userId);
                return res.send(htmlRedirect(`${process.env.FRONTEND_URL}/dashboard?spotify_sync=success`));
            } catch (err) {
                console.log('[Spotify] JWT invalid, proceeding to login/register flow');
            }
        }

        // SCENARIO 2: Spotify Sign-In (Login or Register)
        let userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
        let user = userResult.rows[0];

        if (!user) {
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            const stdRefreshToken = jwt.sign({ tempId: crypto.randomBytes(16).toString('hex') }, process.env.JWT_SECRET, { expiresIn: '7d' });

            const insertSql = `
                INSERT INTO users (name, email, password_hash, refresh_token, spotify_access_token, spotify_refresh_token, spotify_token_expiry)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, name, email
            `;
            const insertResult = await query(insertSql, [
                spotifyName || null,
                email,
                hashedPassword,
                stdRefreshToken,
                tokens.access_token || null,
                encryptedRefreshToken || null,
                expiryDate || null
            ]);
            user = insertResult.rows[0];
            user.refresh_token = stdRefreshToken;
            console.log('[Spotify] New user created:', user.id);
        } else {
            await query('UPDATE users SET spotify_access_token = $1, spotify_refresh_token = COALESCE($2, spotify_refresh_token), spotify_token_expiry = $3 WHERE id = $4', [
                tokens.access_token || null,
                encryptedRefreshToken || null,
                expiryDate || null,
                user.id
            ]);

            user.refresh_token = jwt.sign({ tempId: crypto.randomBytes(16).toString('hex') }, process.env.JWT_SECRET, { expiresIn: '7d' });
            await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [user.refresh_token, user.id]);
            console.log('[Spotify] Existing user updated:', user.id);
        }

        const jwtToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
        res.cookie('jwt', jwtToken, COOKIE_OPTIONS);
        res.cookie('refreshToken', user.refresh_token, REFRESH_COOKIE_OPTIONS);

        console.log('[Spotify] Auth complete, redirecting to dashboard');
        res.send(htmlRedirect(`${process.env.FRONTEND_URL}/dashboard?login=success`));
    } catch (err) {
        console.error('[Spotify] Auth Callback Error:', err.response?.data || err.message);

        res.send(htmlRedirect(`${process.env.FRONTEND_URL}/login?error=spotify_auth_failed`));
    }
};
