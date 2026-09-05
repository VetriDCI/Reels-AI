import express from 'express';
import { getAdminStats, getAdminUsers, updateUserStatus, getAdminPosts, deleteAdminPost, updatePostStatus, changeAdminPassword } from '../controllers/adminController.js';
import { protectAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/stats', protectAdmin, getAdminStats);
router.get('/users', protectAdmin, getAdminUsers);
router.patch('/users/:id/status', protectAdmin, updateUserStatus);
router.get('/posts', protectAdmin, getAdminPosts);
router.patch('/posts/:id/status', protectAdmin, updatePostStatus);
router.delete('/posts/:id', protectAdmin, deleteAdminPost);
router.put('/change-password', protectAdmin, changeAdminPassword);

export default router;
