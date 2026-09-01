import express from 'express';
import { getAdminStats, getAdminUsers, updateUserStatus } from '../controllers/adminController.js';
import { protectAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/stats', protectAdmin, getAdminStats);
router.get('/users', protectAdmin, getAdminUsers);
router.patch('/users/:id/status', protectAdmin, updateUserStatus);

export default router;
