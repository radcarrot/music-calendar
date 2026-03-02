// backend/src/controllers/artistController.js
import { query } from '../config/database.js';

/**
 * GET /api/artists
 */
export const getAllArtists = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, spotify_id, genres, image_url, created_at FROM artists ORDER BY id DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching artists:', err);
    res.status(500).json({ error: 'Failed to fetch artists' });
  }
};

/**
 * POST /api/artists
 * Body: { name, spotify_id?, genres?, image_url? }
 */
export const createArtist = async (req, res) => {
  try {
    const { name, spotify_id = null, genres = null, image_url = null } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    const sql = `
      INSERT INTO artists (name, spotify_id, genres, image_url)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, spotify_id, genres, image_url, created_at;
    `;

    const result = await query(sql, [name, spotify_id, genres, image_url]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating artist:', err);
    res.status(500).json({ error: 'Failed to create artist' });
  }
};

/**
 * POST /api/artists/track
 * Body: { artist_id }
 */
export const trackArtist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { artist_id } = req.body;

    if (!artist_id) return res.status(400).json({ error: 'artist_id is required' });

    // Add to user_artists, ON CONFLICT DO NOTHING to avoid duplicate errors
    const sql = `
            INSERT INTO user_artists (user_id, artist_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
        `;
    await query(sql, [userId, artist_id]);

    res.status(200).json({ message: 'Artist tracked successfully' });
  } catch (err) {
    console.error('Error tracking artist:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/artists/tracked
 */
export const getTrackedArtists = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
            SELECT a.id, a.name, a.image_url, a.genres, a.spotify_id 
            FROM artists a
            JOIN user_artists ua ON a.id = ua.artist_id
            WHERE ua.user_id = $1
            ORDER BY a.name ASC
        `;
    const result = await query(sql, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tracked artists:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
