import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database.js';


export const checkUsername = async (req, res) => {
  try {
    const username = String(req.query.username || '').trim();

    if (!username) {
      return res.json({ success: true, data: { available: false, reason: 'empty' } });
    }

    if (username.length < 3) {
      return res.json({ success: true, data: { available: false, reason: 'too_short' } });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });

    return res.json({
      success: true,
      data: { available: !existingUser }
    });
  } catch (error) {
    console.error('Check username error:', error);
    return res.status(500).json({ success: false, message: 'Failed to check username' });
  }
};

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
    const { identifier, email, password } = req.body;
    const loginIdentifier = String(identifier ?? email ?? '').trim();

    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, message: 'Email, username or phone number and password are required' });
    }

    const normalizedPhone = loginIdentifier.replace(/\D/g, '');
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginIdentifier.toLowerCase() },
          { username: loginIdentifier },
          ...(normalizedPhone ? [{ phoneNumber: normalizedPhone }] : [])
        ]
      }
    });

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
        id: true, username: true, email: true, phoneNumber: true, fullName: true, bio: true, avatarUrl: true, earnings: true,
        monetizationStatus: true, monetizationAppliedAt: true, monetizationApprovedAt: true, createdAt: true,
        channelNumber: true, channelName: true, channelCreatedAt: true,
        posts: { select: { id: true, content: true, mediaUrl: true, mediaType: true, createdAt: true, likes: { select: { id: true } }, comments: { select: { id: true } } }, orderBy: { createdAt: 'desc' }, take: 9 },
        _count: { select: { followers: true, following: true } }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { _count, ...rest } = user;
    res.json({
      success: true,
      data: { ...rest, postsCount: user.posts.length, followersCount: _count.followers, followingCount: _count.following }
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

// Password reset OTPs are random, short-lived and stored only as bcrypt hashes.
// Production delivery uses Resend. Development can explicitly expose the random OTP.
const sendPasswordResetEmail = async ({ to, otp }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error('Password reset email service is not configured');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from, to: [to], subject: 'RA Social password reset OTP',
      html: `<p>Your RA Social password reset code is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes.</p>`,
    }),
  });
  if (!response.ok) throw new Error(`Resend email failed: ${response.status}`);
};

export const forgotPassword = async (req, res) => {
  try {
    const identifier = String(req.body?.identifier || '').trim();
    if (!identifier) return res.status(400).json({ success: false, message: 'Email, mobile or username is required' });
    const normalizedPhone = identifier.replace(/\D/g, '');
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier.toLowerCase() }, { username: identifier }, ...(normalizedPhone ? [{ phoneNumber: normalizedPhone }] : [])] },
      select: { id: true, email: true },
    });
    if (!user) return res.json({ success: true, message: 'If an account matches, reset instructions will be sent.' });

    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = await bcrypt.hash(otp, 10);
    const challenge = await prisma.passwordResetChallenge.create({
      data: { userId: user.id, otpHash, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      select: { id: true },
    });
    const devMode = process.env.NODE_ENV !== 'production' && process.env.PASSWORD_RESET_DEV_MODE === 'true';
    if (!devMode) await sendPasswordResetEmail({ to: user.email, otp });

    res.json({ success: true, message: devMode ? 'OTP generated in development mode.' : 'If an account matches, reset instructions will be sent.', data: { challengeId: challenge.id, ...(devMode ? { devOtp: otp } : {}) } });
  } catch (error) {
    console.error('Forgot password error:', error);
    if (error.message?.includes('not configured') || error.message?.includes('Resend email failed')) return res.status(503).json({ success: false, message: 'Password reset email service is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.' });
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { identifier, otp, challengeId } = req.body;
    if (!identifier || !otp || !challengeId) return res.status(400).json({ success: false, message: 'Identifier, OTP and challenge are required' });
    const challenge = await prisma.passwordResetChallenge.findUnique({ where: { id: challengeId } });
    if (!challenge || challenge.usedAt || challenge.verifiedAt || challenge.expiresAt < new Date()) return res.status(401).json({ success: false, message: 'OTP expired or already used' });
    const valid = await bcrypt.compare(String(otp), challenge.otpHash);
    if (!valid) return res.status(400).json({ success: false, message: 'Invalid OTP' });
    const normalizedPhone = String(identifier).replace(/\D/g, '');
    const user = await prisma.user.findFirst({ where: { id: challenge.userId, OR: [{ email: String(identifier).toLowerCase() }, { username: identifier }, ...(normalizedPhone ? [{ phoneNumber: normalizedPhone }] : [])] }, select: { id:true } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid reset request' });
    await prisma.passwordResetChallenge.update({ where: { id: challenge.id }, data: { verifiedAt: new Date() } });
    const resetToken = jwt.sign({ userId: user.id, purpose: 'reset', challengeId: challenge.id }, process.env.JWT_SECRET, { expiresIn: '10m' });
    res.json({ success: true, message: 'OTP verified', data: { resetToken } });
  } catch (error) { console.error('Verify OTP error:', error); res.status(500).json({ success: false, message: 'Failed to verify OTP' }); }
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

    if (decoded.purpose !== 'reset' || !decoded.challengeId) {
      return res.status(401).json({ success: false, message: 'Invalid reset token' });
    }

    const challenge = await prisma.passwordResetChallenge.findUnique({ where: { id: decoded.challengeId } });
    if (!challenge || challenge.userId !== decoded.userId || !challenge.verifiedAt || challenge.usedAt || challenge.expiresAt < new Date()) {
      return res.status(401).json({ success: false, message: 'Reset request is invalid or expired' });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await prisma.$transaction([
      prisma.user.update({ where: { id: decoded.userId }, data: { passwordHash } }),
      prisma.passwordResetChallenge.update({ where: { id: decoded.challengeId }, data: { usedAt: new Date() } }),
    ]);
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

// POST /api/auth/channel - create one creator channel for the logged-in user
export const createChannel = async (req, res) => {
  try {
    const userId = req.userId;
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, fullName: true, channelNumber: true, channelName: true, channelCreatedAt: true }
    });

    if (!existing) return res.status(404).json({ success: false, message: 'User not found' });
    if (existing.channelNumber) {
      return res.status(409).json({ success: false, message: 'You already have a creator channel', data: existing });
    }

    let channelNumber;
    for (let i = 0; i < 10; i += 1) {
      const candidate = `RA-${crypto.randomInt(10000000, 100000000)}`;
      const taken = await prisma.user.findUnique({ where: { channelNumber: candidate }, select: { id: true } });
      if (!taken) { channelNumber = candidate; break; }
    }
    if (!channelNumber) {
      return res.status(500).json({ success: false, message: 'Could not generate a channel number. Please try again.' });
    }

    const channelName = (req.body?.channelName || existing.fullName || existing.username || 'My Channel').trim().slice(0, 80);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { channelNumber, channelName, channelCreatedAt: new Date() },
      select: { id: true, username: true, fullName: true, channelNumber: true, channelName: true, channelCreatedAt: true }
    });

    res.status(201).json({ success: true, message: 'Creator channel created successfully', data: updated });
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ success: false, message: 'Failed to create creator channel' });
  }
};
