import express from 'express';
import {
  createPost,
  getFeed,
  getPostById,
  likePost,
  addComment,
  deletePost
} from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.post('/upload', protect, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({
    success: true,
    data: {
      url: req.file.path || req.file.secure_url,
      mediaType: req.file.mimetype?.startsWith('video/') ? 'video' : 'image'
    }
  });
});
router.post('/', protect, createPost);
router.get('/feed', getFeed);
router.get('/:id', getPostById);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, likePost);
router.post('/:id/comments', protect, addComment);

export default router;