import express from 'express';
import { query, validationResult } from 'express-validator';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getSpotifyStatus, getTopArtists, searchArtists, disconnectSpotify } from '../controllers/spotifyController.js';

const router = express.Router();

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    next();
};

const validateSearch = [
    query('q').trim().notEmpty().withMessage('Search query required').escape(),
    handleValidationErrors
];

router.get('/status', authenticateToken, getSpotifyStatus);
// Cache the top-artists response for 15 minutes (900s) to prevent Spotify rate limiting
router.get('/top-artists', authenticateToken, cacheMiddleware(900), getTopArtists);
router.get('/search', authenticateToken, validateSearch, searchArtists);
router.post('/disconnect', authenticateToken, disconnectSpotify);

export default router;
