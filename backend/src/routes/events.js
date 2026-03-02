import express from 'express';
import { body, validationResult } from 'express-validator';
import { getEvents, createEvent, deleteEvent } from '../controllers/eventsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All event routes are protected
router.use(authenticateToken);

// OWASP #3: Input Validation & XSS Defense Middleware
const validateEventPost = [
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Valid title is required (1-255 chars)').escape(),
    body('event_date').trim().notEmpty().withMessage('Valid date is required'),
    body('description').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage('Description max 2000 chars').escape(),
    body('category').optional({ checkFalsy: true }).trim().isLength({ max: 50 }).escape(),
    body('external_url').optional({ checkFalsy: true }).isURL().withMessage('Must be a valid URL'),
    body('artist_ids').optional().isArray(),
    body('artist_ids.*').isInt(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Validation failed', details: errors.array() });
        }
        next();
    }
];

router.get('/', getEvents);
router.post('/', validateEventPost, createEvent);
router.delete('/:id', deleteEvent);

export default router;
