// backend/src/routes/artists.js
import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { getAllArtists, createArtist, trackArtist, getTrackedArtists, untrackArtist } from '../controllers/artistController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// OWASP #3: Input Sanitization
const validateArtistPost = [
    body('name').trim().isLength({ min: 1, max: 255 }).escape().withMessage('Valid artist name required'),
    body('spotify_id').optional({ checkFalsy: true }).trim().escape(),
    body('image_url').optional({ checkFalsy: true }).isURL().withMessage('Valid image URL required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
        next();
    }
];

const validateTrackPost = [
    body('artist_id').isInt().withMessage('Valid integer artist ID required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
        next();
    }
];

const validateArtistId = [
    param('artistId').isInt().withMessage('Valid artist ID required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
        next();
    }
];

router.get('/', getAllArtists);
router.post('/', validateArtistPost, createArtist);

// Protected routes for tracking
router.use(authenticateToken);
router.post('/track', validateTrackPost, trackArtist);
router.delete('/track/:artistId', validateArtistId, untrackArtist);
router.get('/tracked', getTrackedArtists);

export default router;
