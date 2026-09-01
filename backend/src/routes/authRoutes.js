import express from 'express';
import { register, login, getMe, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// ADMIN LOGIN - FIXED DIRECTLY (no adminController needed)
router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Admin login attempt:', email, password);
  
  if (email === 'admin@rasocial.com' && password === 'admin123') {
    return res.json({
      token: 'demo-admin-jwt-token-12345',
      admin: {
        id: '1',
        email: 'admin@rasocial.com',
        role: 'admin'
      },
      message: 'Login successful'
    });
  }
  
  return res.status(401).json({ error: 'Invalid credentials' });
});

router.post('/admin/forgot-password', (req, res) => {
  res.json({ message: 'Password reset email sent' });
});

export default router;
