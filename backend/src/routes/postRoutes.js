import express from 'express';
import {
  createPost,
  getFeed,
  getPostById,
  likePost,
  addComment
} from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createPost);
router.get('/feed', getFeed);
router.get('/:id', getPostById);
router.post('/:id/like', protect, likePost);
router.post('/:id/comments', protect, addComment);

export default router;