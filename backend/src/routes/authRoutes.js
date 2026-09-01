import express from 'express';
import { register, login, getMe, updateProfile } from '../controllers/authController.js';
import { adminLogin, adminForgotPassword } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/admin/login', adminLogin);
router.post('/admin/forgot-password', adminForgotPassword);

export default router;