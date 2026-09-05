import express from 'express';
import { getChats, getChatMessages, markChatRead, createChat, sendMessage } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getChats);
router.get('/:chatId/messages', protect, getChatMessages);
router.post('/:chatId/read', protect, markChatRead);
router.post('/:chatId/messages', protect, sendMessage);
router.post('/', protect, createChat);

export default router;
