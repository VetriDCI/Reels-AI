import express from 'express';
import { getAds, createAd, updateAd, deleteAd } from '../controllers/adminAdsController.js';
import { getAdminStats, adminLogout, getAdminUsers, updateUserStatus, getAdminPosts, deleteAdminPost, updatePostStatus, changeAdminPassword, getMonetizationApplications, updateMonetizationApplication, getAdminReports, updateReportStatus, getBroadcasts, getBroadcastReach, createBroadcast, getAdminVibes, updateVibeStatus, deleteAdminVibe, getAdminPayouts, updatePayoutStatus, creditCreatorEarning, getCreatorAds, updateCreatorAdStatus } from '../controllers/adminController.js';
import { protectAdmin } from '../middleware/adminMiddleware.js';
import { getAdminNotificationCounts } from '../controllers/adminNotificationsController.js';
import prisma from '../config/database.js';

const router = express.Router();

router.get('/stats', protectAdmin, getAdminStats);
router.get('/notifications/counts', protectAdmin, getAdminNotificationCounts);
router.get('/audit-logs', protectAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const action = String(req.query.action || '').trim();
    const where = action ? { action: { contains: action, mode: 'insensitive' } } : {};
    const [items, total] = await Promise.all([
      prisma.adminAuditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, select: { id: true, action: true, targetType: true, targetId: true, details: true, createdAt: true } }),
      prisma.adminAuditLog.count({ where }),
    ]);
    res.json({ items, page, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) {
    console.error('Admin audit logs error:', error);
    res.status(500).json({ error: 'Failed to load audit logs' });
  }
});
router.post('/logout', protectAdmin, adminLogout);
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
router.get('/broadcasts/reach', protectAdmin, getBroadcastReach);
router.get('/broadcasts', protectAdmin, getBroadcasts);
router.post('/broadcasts', protectAdmin, createBroadcast);
router.get('/ads', protectAdmin, getAds);
router.post('/ads', protectAdmin, createAd);
router.patch('/ads/:id', protectAdmin, updateAd);
router.delete('/ads/:id', protectAdmin, deleteAd);
router.get('/payouts', protectAdmin, getAdminPayouts);
router.get('/creator-ads', protectAdmin, getCreatorAds);
router.patch('/creator-ads/:id/status', protectAdmin, updateCreatorAdStatus);
router.post('/earnings/:userId', protectAdmin, creditCreatorEarning);
router.patch('/payouts/:id/status', protectAdmin, updatePayoutStatus);
router.get('/vibes', protectAdmin, getAdminVibes);
router.patch('/vibes/:id/status', protectAdmin, updateVibeStatus);
router.delete('/vibes/:id', protectAdmin, deleteAdminVibe);

export default router;
