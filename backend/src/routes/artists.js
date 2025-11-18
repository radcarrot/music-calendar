// backend/src/routes/artists.js
import express from 'express';
import { getAllArtists, createArtist } from '../controllers/artistController.js';

const router = express.Router();

router.get('/', getAllArtists);
router.post('/', createArtist);

export default router;
