import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createSupportTicket, getMySupportTickets } from '../controllers/supportController.js';

const router = express.Router();
router.use(protect);
router.get('/mine', getMySupportTickets);
router.post('/', createSupportTicket);
export default router;
