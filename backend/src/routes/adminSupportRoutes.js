import express from 'express';
import { protectAdmin } from '../middleware/adminMiddleware.js';
import { getAdminSupportTickets, updateAdminSupportTicket, replyToSupportTicket } from '../controllers/supportController.js';

const router = express.Router();
router.use(protectAdmin);
router.get('/', getAdminSupportTickets);
router.patch('/:id/status', updateAdminSupportTicket);
router.post('/:id/reply', replyToSupportTicket);
export default router;
