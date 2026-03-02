import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import artistsRouter from './src/routes/artists.js';
import authRouter from './src/routes/auth.js';
import eventsRouter from './src/routes/events.js';


const app = express();

// Security Headers (OWASP #5)
app.use(helmet());
app.disable('x-powered-by');

// Global Rate Limiting (OWASP #4 - DoS Prevention)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests from this IP, please try again later.' },
  skip: (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.ip),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// CORS Hardening
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Music Calendar API is running!' });
});

// mount routes
app.use('/api/artists', artistsRouter);
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
