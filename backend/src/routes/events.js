import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { getEvents, createEvent, deleteEvent } from '../controllers/eventsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// All event routes are protected
router.use(authenticateToken);

// OWASP #3: Input Validation & XSS Defense Middleware
const validateEventPost = [
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Valid title is required (1-255 chars)').escape(),
    body('event_date').trim().notEmpty().withMessage('Valid date is required'),
    body('description').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage('Description max 2000 chars').escape(),
    body('category').optional({ checkFalsy: true }).trim().isIn(['Album Drop', 'Single', 'Concert', 'Listening Party', 'Miscellaneous']).withMessage('Invalid category'),
    body('external_url').optional({ checkFalsy: true }).isURL().withMessage('Must be a valid URL'),
    body('artist_ids').optional().isArray(),
    body('artist_ids.*').isInt(),
    body('start_time').optional({ checkFalsy: true }).matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Start time must be HH:mm'),
    body('end_time').optional({ checkFalsy: true }).matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('End time must be HH:mm'),
    body('sync_to_google').optional().isBoolean(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Validation failed', details: errors.array() });
        }
        next();
    }
];

const validateEventId = [
    param('id').isInt().withMessage('Valid event ID required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
        next();
    }
];

// Cache events queries for 3 minutes to save DB joins unless invalidated
router.get('/', cacheMiddleware(180), getEvents);
router.post('/', validateEventPost, createEvent);
router.delete('/:id', validateEventId, deleteEvent);

export default router;
