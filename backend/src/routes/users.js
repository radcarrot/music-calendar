import express from 'express';
import { body, validationResult } from 'express-validator';
import { getProfile, updatePreferences, updatePassword, deleteAccount, uploadProfileImage } from '../controllers/usersController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/profiles/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: function (_req, file, cb) {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
        }
    }
});

const router = express.Router();

// Input Validation 
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    next();
};

const validatePreferences = [
    body('google_sync_enabled').optional().isBoolean(),
    body('email_alerts').optional().isBoolean(),
    body('push_alerts').optional().isBoolean(),
    handleValidationErrors
];

const validatePassword = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long'),
    handleValidationErrors
];

// Both routes require authentication
router.use(authenticateToken);

router.get('/profile', getProfile);
router.put('/preferences', validatePreferences, updatePreferences);
router.put('/password', validatePassword, updatePassword);
router.delete('/profile', deleteAccount);
router.post('/profile-image', upload.single('image'), uploadProfileImage);

export default router;
