import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { register, login, me, refresh, logout, googleAuth, googleCallback, spotifyAuth, spotifyCallback } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Define a rate limiter for the login route
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per 'window' (here, per 15 minutes)
    message: { error: 'Too many login attempts from this IP, please try again after 15 minutes.' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Input Validation & Sanitization Middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    next();
};

const validateRegister = [
    body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Name must be 1-255 characters').escape(),
    body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password too short'),
    handleValidationErrors
];

const validateLogin = [
    body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password required'),
    handleValidationErrors
];

const validateOAuth = [
    query('code').optional({ checkFalsy: true }).trim(),
    query('state').optional({ checkFalsy: true }).trim(),
    handleValidationErrors
];

router.post('/register', validateRegister, register);
router.post('/login', loginLimiter, validateLogin, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticateToken, me);

router.get('/google', googleAuth);
router.get('/google/callback', validateOAuth, googleCallback);

router.get('/spotify', spotifyAuth);
router.get('/spotify/callback', validateOAuth, spotifyCallback);

export default router;
