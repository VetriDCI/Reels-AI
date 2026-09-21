import express from 'express';
import {
  createPost,
  updatePost,
  getFeed,
  getPostById,
  likePost,
  addComment,
  deletePost,
  viewPost,
  hidePost,
  reportPost
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

  const isVideo = req.file.mimetype?.startsWith('video/');
  const uploadedUrl = req.file.path || req.file.secure_url;

  // MediaEditor exports WebM in browsers that use MediaRecorder. Cloudinary
  // can deliver that uploaded video as MP4, which is more reliable across
  // the app's video players and keeps the normal upload path unchanged.
  const playableUrl = isVideo && req.file.mimetype === 'video/webm'
    ? uploadedUrl.replace('/video/upload/', '/video/upload/f_mp4/')
    : uploadedUrl;

  res.json({
    success: true,
    data: {
      url: playableUrl,
      mediaType: isVideo ? 'video' : 'image',
      publicId: req.file.filename || req.file.public_id || null,
      resourceType: req.file.resource_type || (isVideo ? 'video' : 'image')
    }
  });
});
router.post('/', protect, createPost);
router.get('/feed', getFeed);
router.get('/:id', getPostById);
router.delete('/:id', protect, deletePost);
router.patch('/:id', protect, updatePost);
router.patch('/:id/hide', protect, hidePost);
router.post('/:id/report', protect, reportPost);
router.post('/:id/view', protect, viewPost);
router.post('/:id/like', protect, likePost);
router.post('/:id/comments', protect, addComment);

export default router;