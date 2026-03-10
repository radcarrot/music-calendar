import express from 'express';
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

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticateToken, me);

router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

router.get('/spotify', spotifyAuth);
router.get('/spotify/callback', spotifyCallback);

export default router;
