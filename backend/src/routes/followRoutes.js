import express from 'express';
import { followUser, getFollowStatus, getMyFollowers, getMyFollowing } from '../controllers/followController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me/followers', protect, getMyFollowers);
router.get('/me/following', protect, getMyFollowing);
router.post('/:userId', protect, followUser);
router.get('/:userId/status', protect, getFollowStatus);

export default router;
