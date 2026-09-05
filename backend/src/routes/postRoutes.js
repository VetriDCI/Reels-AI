import express from 'express';
import {
  createPost,
  getFeed,
  getPostById,
  likePost,
  addComment,
  deletePost,
  viewPost
} from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload, cloudinary } from '../config/cloudinary.js';
import axios from 'axios';

const router = express.Router();

router.get('/:id/download', async (req, res) => {
  try {
    const post = await (await import('../config/database.js')).default.post.findUnique({ where: { id: req.params.id }, select: { mediaUrl: true, mediaType: true } });
    if (!post?.mediaUrl) return res.status(404).json({ success: false, message: 'Media not found' });
    const upstream = await axios.get(post.mediaUrl, { responseType: 'stream', timeout: 60000 });
    const contentType = upstream.headers['content-type'] || (post.mediaType === 'video' ? 'video/mp4' : 'image/jpeg');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="ra-social-${req.params.id}.${post.mediaType === 'video' ? 'mp4' : 'jpg'}"`);
    upstream.data.on('error', () => { if (!res.headersSent) res.status(502); else res.destroy(); });
    upstream.data.pipe(res);
  } catch (error) {
    console.error('Download media error:', error.message);
    res.status(502).json({ success: false, message: 'Unable to download media' });
  }
});
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
router.post('/:id/view', protect, viewPost);
router.post('/:id/like', protect, likePost);
router.post('/:id/comments', protect, addComment);

export default router;