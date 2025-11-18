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
