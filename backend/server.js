import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import artistsRouter from './src/routes/artists.js';
import authRouter from './src/routes/auth.js';


const app = express();

app.use(cors({ origin: true, credentials: true })); // Allow credentials for cookies
app.use(express.json());
app.use(cookieParser());

// health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Music Calendar API is running!' });
});

// mount routes
app.use('/api/artists', artistsRouter);
app.use('/api/auth', authRouter);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
