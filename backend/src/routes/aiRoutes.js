import express from 'express';
import {
  generateCaption,
  generateHashtags,
  translateText,
  moderateContent,
  chatWithAI
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate-caption', protect, generateCaption);
router.post('/generate-hashtags', protect, generateHashtags);
router.post('/translate', protect, translateText);
router.post('/moderate', protect, moderateContent);
router.post('/chat', protect, chatWithAI);

export default router;