import express from 'express';
import { register, login, getMe, updateProfile, forgotPassword, verifyOtp, resetPassword, changePassword } from '../controllers/authController.js';
import { adminLogin, adminForgotPassword } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.put('/change-password', protect, changePassword);
router.post('/admin/login', adminLogin);
router.post('/admin/forgot-password', adminForgotPassword);

export default router;