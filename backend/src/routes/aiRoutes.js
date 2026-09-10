import express from 'express';
import {
  chatWithAI,
  generateImage,
  uploadAIFile,
  listAIConversations,
  getAIConversation,
  deleteAIConversation,
  aiUpload
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/history', protect, listAIConversations);
router.get('/history/:id', protect, getAIConversation);
router.delete('/history/:id', protect, deleteAIConversation);
router.post('/upload', protect, aiUpload.array('files', 6), uploadAIFile);
router.post('/chat', protect, chatWithAI);
router.post('/image', protect, generateImage);

export default router;
