import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

export const register = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email and password are required' });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email or username' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { username, email, passwordHash, fullName: fullName || username },
      select: { id: true, username: true, email: true, fullName: true, avatarUrl: true, createdAt: true }
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

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

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user.id, username: user.username, email: user.email, fullName: user.fullName, avatarUrl: user.avatarUrl, bio: user.bio },
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
        id: true, username: true, email: true, fullName: true, bio: true, avatarUrl: true, createdAt: true,
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
    const { fullName, bio } = req.body;
    const userId = req.userId;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { fullName, bio },
      select: { id: true, username: true, fullName: true, bio: true, avatarUrl: true }
    });

    res.json({ success: true, message: 'Profile updated successfully', data: user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};