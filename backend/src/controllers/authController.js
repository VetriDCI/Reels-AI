import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

export const register = async (req, res) => {
  try {
    const { username, email, password, fullName, phoneNumber } = req.body;
    const normalizedPhone = phoneNumber ? String(phoneNumber).replace(/\D/g, '') : null;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email and password are required' });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }, ...(normalizedPhone ? [{ phoneNumber: normalizedPhone }] : [])] },
      select: { id: true, email: true, username: true, phoneNumber: true }
    });

    if (existingUser) {
      const duplicateField = existingUser.email === email
        ? 'email'
        : existingUser.username === username
          ? 'username'
          : 'phone number';
      return res.status(409).json({ success: false, message: `An account already exists with this ${duplicateField}` });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { username, email, passwordHash, fullName: fullName || username, phoneNumber: normalizedPhone || null },
      select: { id: true, username: true, email: true, phoneNumber: true, fullName: true, avatarUrl: true, createdAt: true }
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '365d' });

    res.status(201).json({ success: true, message: 'User registered successfully', data: { user, token } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (user.status === 'blocked') {
      return res.status(403).json({ success: false, message: 'Your account has been blocked by an administrator' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '365d' });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user.id, username: user.username, email: user.email, phoneNumber: user.phoneNumber, fullName: user.fullName, avatarUrl: user.avatarUrl, bio: user.bio },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, username: true, email: true, phoneNumber: true, fullName: true, bio: true, avatarUrl: true, earnings: true, createdAt: true,
        posts: { select: { id: true, content: true, mediaUrl: true, mediaType: true, createdAt: true, likes: { select: { id: true } }, comments: { select: { id: true } } }, orderBy: { createdAt: 'desc' }, take: 9 },
        followers: { select: { id: true } },
        following: { select: { id: true } }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: { ...user, postsCount: user.posts.length, followersCount: user.followers.length, followingCount: user.following.length }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user data' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, bio, avatarUrl, phoneNumber } = req.body;
    const userId = req.userId;

    const data = { fullName, bio };
    if (avatarUrl) data.avatarUrl = avatarUrl;
    if (phoneNumber !== undefined) {
      const normalizedPhone = phoneNumber ? String(phoneNumber).replace(/\D/g, '') : null;
      if (normalizedPhone) {
        const duplicate = await prisma.user.findFirst({
          where: { phoneNumber: normalizedPhone, NOT: { id: userId } },
          select: { id: true }
        });
        if (duplicate) {
          return res.status(409).json({ success: false, message: 'This phone number is already linked to another account' });
        }
      }
      data.phoneNumber = normalizedPhone;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, username: true, fullName: true, bio: true, avatarUrl: true, phoneNumber: true }
    });

    res.json({ success: true, message: 'Profile updated successfully', data: user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// POST /api/auth/forgot-password
// NOTE: No SMS/email provider is wired up in this project yet, so a real OTP
// can't be delivered. This uses a fixed demo OTP (123456) so the reset flow
// is fully functional end-to-end for testing/demo — replace with a real
// SMS/email provider (e.g. Twilio, Resend) before going to production.
export const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Email, mobile or username is required' });
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with that email/username' });
    }

    res.json({ success: true, message: 'OTP sent (demo mode: use 123456)', data: { demoOtp: '123456' } });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
};

// POST /api/auth/verify-otp
export const verifyOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ success: false, message: 'Identifier and OTP are required' });
    }

    if (otp !== '123456') {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const resetToken = jwt.sign({ userId: user.id, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '10m' });

    res.json({ success: true, message: 'OTP verified', data: { resetToken } });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Reset link expired, please try again' });
    }

    if (decoded.purpose !== 'reset') {
      return res.status(401).json({ success: false, message: 'Invalid reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({ where: { id: decoded.userId }, data: { passwordHash } });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

// PUT /api/auth/change-password  (for logged-in users, Account & Security screen)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};