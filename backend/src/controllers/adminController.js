import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

// POST /api/auth/admin/login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.role !== 'admin') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      admin: { id: user.id, username: user.username, email: user.email, fullName: user.fullName }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// POST /api/auth/admin/forgot-password
export const adminForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findFirst({ where: { email, role: 'admin' } });

    if (!user) {
      return res.status(404).json({ error: 'Email not found. Please contact support.' });
    }

    res.json({ message: 'If email service is configured, a reset link would be sent here.' });
  } catch (error) {
    console.error('Admin forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

// GET /api/admin/stats
export const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalPosts, totalReels, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.post.count({ where: { mediaType: 'video' } }),
      prisma.user.count({ where: { status: 'active' } }),
    ]);

    res.json({
      totalUsers,
      totalPosts,
      totalReels,
      pendingPayouts: 0,
      activeUsers,
      reportedContent: 0,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// GET /api/admin/users?limit=5
export const getAdminUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        status: true,
        earnings: true,
        createdAt: true,
      },
    });

    const mapped = users.map((u) => ({
      id: u.id,
      username: u.username,
      full_name: u.fullName,
      email: u.email,
      status: u.status,
      earnings: u.earnings,
      created_at: u.createdAt,
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// PATCH /api/admin/users/:id/status
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "active" or "blocked"' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, username: true, status: true },
    });

    res.json(user);
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};