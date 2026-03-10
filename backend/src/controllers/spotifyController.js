import axios from 'axios';
import { query } from '../config/database.js';
import { decrypt, encrypt } from '../utils/crypto.js';

/**
 * Refresh the Spotify access token using the stored refresh token.
 * Updates the database with the new access token.
 */
async function refreshSpotifyToken(userId) {
    const result = await query('SELECT spotify_refresh_token, spotify_token_expiry FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];

    if (!user || !user.spotify_refresh_token) {
        throw new Error('No Spotify refresh token found');
    }

    const decryptedRefreshToken = decrypt(user.spotify_refresh_token);

    const tokenResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: decryptedRefreshToken
        }).toString(),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(
                    process.env.SPOTIFY_CLIENT_ID.trim() + ':' + process.env.SPOTIFY_CLIENT_SECRET.trim()
                ).toString('base64')
            }
        }
    );

    const { access_token, refresh_token: newRefreshToken, expires_in } = tokenResponse.data;
    const newExpiry = Date.now() + expires_in * 1000;

    // If Spotify sent a new refresh token, encrypt and store it
    const encryptedNewRefresh = newRefreshToken ? encrypt(newRefreshToken) : null;

    await query(
        'UPDATE users SET spotify_access_token = $1, spotify_refresh_token = COALESCE($2, spotify_refresh_token), spotify_token_expiry = $3 WHERE id = $4',
        [access_token, encryptedNewRefresh, newExpiry, userId]
    );

    return access_token;
}

/**
 * Get a valid Spotify access token for the user.
 * Refreshes automatically if expired.
 */
async function getValidToken(userId) {
    const result = await query('SELECT spotify_access_token, spotify_token_expiry FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];

    if (!user || !user.spotify_access_token) {
        return null;
    }

    // Check if token is expired (with 60s buffer)
    if (user.spotify_token_expiry && Date.now() > (Number(user.spotify_token_expiry) - 60000)) {
        console.log('[Spotify] Token expired, refreshing...');
        return await refreshSpotifyToken(userId);
    }

    return user.spotify_access_token;
}

/**
 * GET /api/spotify/status
 * Returns whether the user has Spotify connected.
 */
export const getSpotifyStatus = async (req, res) => {
    try {
        const result = await query('SELECT spotify_access_token FROM users WHERE id = $1', [req.user.id]);
        const user = result.rows[0];
        res.json({ connected: !!user?.spotify_access_token });
    } catch (err) {
        console.error('[Spotify] Status check error:', err.message);
        res.status(500).json({ error: 'Failed to check Spotify status' });
    }
};

/**
 * GET /api/spotify/top-artists
 * Returns the user's top artists from Spotify.
 */
export const getTopArtists = async (req, res) => {
    try {
        const accessToken = await getValidToken(req.user.id);
        if (!accessToken) {
            return res.status(401).json({ error: 'Spotify not connected' });
        }

        const response = await axios.get('https://api.spotify.com/v1/me/top/artists', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: { limit: 20, time_range: 'medium_term' }
        });

        const artists = response.data.items.map(artist => ({
            spotify_id: artist.id,
            name: artist.name,
            image_url: artist.images?.[0]?.url || null,
            genres: artist.genres || [],
            popularity: artist.popularity
        }));

        res.json(artists);
    } catch (err) {
        console.error('[Spotify] Top artists error:', err.response?.data || err.message);
        if (err.response?.status === 401) {
            return res.status(401).json({ error: 'Spotify token expired, please reconnect' });
        }
        res.status(500).json({ error: 'Failed to fetch top artists' });
    }
};

/**
 * GET /api/spotify/search?q=query
 * Search for artists on Spotify. Used for tagging events.
 */
export const searchArtists = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length === 0) {
            return res.json([]);
        }

        const accessToken = await getValidToken(req.user.id);
        if (!accessToken) {
            return res.status(401).json({ error: 'Spotify not connected' });
        }

        const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
            params: { q: q.trim(), type: 'artist', limit: 10 }
        });

        const artists = response.data.artists.items.map(artist => ({
            spotify_id: artist.id,
            name: artist.name,
            image_url: artist.images?.[0]?.url || null,
            genres: artist.genres?.slice(0, 3) || [],
            popularity: artist.popularity
        }));

        res.json(artists);
    } catch (err) {
        console.error('[Spotify] Search error:', err.response?.data || err.message);
        if (err.response?.status === 401) {
            return res.status(401).json({ error: 'Spotify token expired, please reconnect' });
        }
        res.status(500).json({ error: 'Failed to search artists' });
    }
};
