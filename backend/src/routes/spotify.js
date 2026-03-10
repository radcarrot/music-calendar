import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getSpotifyStatus, getTopArtists, searchArtists } from '../controllers/spotifyController.js';

const router = express.Router();

router.get('/status', authenticateToken, getSpotifyStatus);
router.get('/top-artists', authenticateToken, getTopArtists);
router.get('/search', authenticateToken, searchArtists);

export default router;
