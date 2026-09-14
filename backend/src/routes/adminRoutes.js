import express from 'express';
import { getAdminStats, getAdminUsers, updateUserStatus, getAdminPosts, deleteAdminPost, updatePostStatus, changeAdminPassword, getMonetizationApplications, updateMonetizationApplication, getAdminReports, updateReportStatus, getBroadcasts, createBroadcast } from '../controllers/adminController.js';
import { protectAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.get('/stats', protectAdmin, getAdminStats);
router.get('/users', protectAdmin, getAdminUsers);
router.patch('/users/:id/status', protectAdmin, updateUserStatus);
router.get('/posts', protectAdmin, getAdminPosts);
router.patch('/posts/:id/status', protectAdmin, updatePostStatus);
router.delete('/posts/:id', protectAdmin, deleteAdminPost);
router.put('/change-password', protectAdmin, changeAdminPassword);
router.get('/monetization', protectAdmin, getMonetizationApplications);
router.patch('/monetization/:id', protectAdmin, updateMonetizationApplication);
router.get('/reports', protectAdmin, getAdminReports);
router.patch('/reports/:id/status', protectAdmin, updateReportStatus);
router.get('/broadcasts', protectAdmin, getBroadcasts);
router.post('/broadcasts', protectAdmin, createBroadcast);

export default router;
