import express from 'express';
import { chatWithAI, generateImage } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/chat', protect, chatWithAI);
router.post('/image', protect, generateImage);

export default router;
