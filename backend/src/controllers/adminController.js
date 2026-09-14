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

    // NOTE: No email-sending service (SMTP/SendGrid/Resend) is wired up in this
    // project yet, so a real reset link can't be emailed out right now. This
    // endpoint confirms the admin account exists so the frontend isn't relying
    // on a hardcoded email check. Wire up an email provider here later to
    // actually send the reset link.
    res.json({ message: 'If email service is configured, a reset link would be sent here.' });
  } catch (error) {
    console.error('Admin forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

// GET /api/admin/stats
export const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalPosts, totalReels, activeUsers, earningsAgg, totalViewsAgg, pendingReports] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.post.count({ where: { mediaType: 'video' } }),
      prisma.user.count({ where: { status: 'active' } }),
      prisma.user.aggregate({ _sum: { earnings: true } }),
      prisma.post.aggregate({ _sum: { viewCount: true } }),
      prisma.report.count({ where: { status: 'pending' } }),
    ]);

    // Payout requests are not implemented yet, so pendingPayouts remains 0.
    // Views and pending reports come from the real database fields/models.
    res.json({
      totalUsers,
      totalPosts,
      totalReels,
      pendingPayouts: 0,
      activeUsers,
      reportedContent: pendingReports,
      totalEarnings: earningsAgg._sum.earnings || 0,
      totalViews: totalViewsAgg._sum.viewCount || 0,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// GET /api/admin/users?limit=5
export const getAdminUsers = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 200);
    const status = String(req.query.status || 'all');
    const sort = String(req.query.sort || 'joined');
    const where = status !== 'all' && ['active', 'blocked', 'pending'].includes(status) ? { status } : {};
    const orderBy = sort === 'earnings' ? { earnings: 'desc' } : { createdAt: 'desc' };
    const users = await prisma.user.findMany({ where, orderBy, take: limit, select: { id:true, username:true, fullName:true, email:true, status:true, earnings:true, monetizationStatus:true, createdAt:true } });
    res.json(users.map((u) => ({ id:u.id, username:u.username, full_name:u.fullName, email:u.email, status:u.status, earnings:u.earnings, monetization_status:u.monetizationStatus, created_at:u.createdAt })));
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// GET /api/admin/posts?limit=20&status=pending
export const getAdminPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const { status, type } = req.query;
    const where = {
      ...(status && status !== 'all' ? { status } : {}),
      ...(type === 'video' ? { mediaType: 'video' } : {}),
    };

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, username: true, fullName: true } },
        likes: { select: { id: true } },
        comments: { select: { id: true } },
      },
    });

    const mapped = posts.map((p) => ({
      id: p.id,
      content: p.content,
      media_url: p.mediaUrl,
      media_type: p.mediaType,
      author: p.user?.fullName || p.user?.username || 'Unknown',
      likes_count: p.likes.length,
      comments_count: p.comments.length,
      views: p.viewCount || 0,
      status: p.status,
      created_at: p.createdAt,
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Admin posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

// PATCH /api/admin/posts/:id/status
export const updatePostStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "approved", "pending" or "rejected"' });
    }

    const post = await prisma.post.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });

    res.json(post);
  } catch (error) {
    console.error('Update post status error:', error);
    res.status(500).json({ error: 'Failed to update post status' });
  }
};

// DELETE /api/admin/posts/:id
export const deleteAdminPost = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.post.delete({ where: { id } });
    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Admin delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

// PUT /api/admin/change-password
export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const admin = await prisma.user.findUnique({ where: { id: req.userId } });
    const isValid = await bcrypt.compare(currentPassword, admin.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({ where: { id: req.userId }, data: { passwordHash } });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change admin password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
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


// GET /api/admin/monetization
export const getMonetizationApplications = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { monetizationStatus: 'pending' },
      orderBy: { monetizationAppliedAt: 'asc' },
      select: {
        id: true, username: true, fullName: true, email: true,
        monetizationStatus: true, monetizationAppliedAt: true,
        _count: { select: { followers: true, posts: true } },
      },
    });
    res.json(users.map((u) => ({
      id: u.id,
      username: u.username,
      full_name: u.fullName,
      email: u.email,
      status: u.monetizationStatus,
      applied_at: u.monetizationAppliedAt,
      followers: u._count.followers,
      posts: u._count.posts,
    })));
  } catch (error) {
    console.error('Admin monetization applications error:', error);
    res.status(500).json({ error: 'Failed to fetch monetization applications' });
  }
};

// PATCH /api/admin/monetization/:id
export const updateMonetizationApplication = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "approved" or "rejected"' });
    }

    const data = {
      monetizationStatus: status === 'approved' ? 'approved' : 'not_eligible',
      ...(status === 'approved' ? { monetizationApprovedAt: new Date() } : { monetizationApprovedAt: null }),
    };

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, username: true, monetizationStatus: true, monetizationApprovedAt: true },
    });

    res.json(user);
  } catch (error) {
    console.error('Update monetization application error:', error);
    res.status(500).json({ error: 'Failed to update monetization application' });
  }
};


export const getAdminReports = async (req, res) => {
  try {
    const status = String(req.query.status || 'all');
    const reports = await prisma.report.findMany({
      where: status !== 'all' && ['pending','reviewed','resolved','dismissed'].includes(status) ? { status } : {},
      orderBy: { createdAt: 'desc' }, take: 100,
      include: { reporter: { select: { id:true, username:true, fullName:true } }, post: { select: { id:true, content:true, mediaUrl:true, mediaType:true, status:true } } }
    });
    res.json(reports);
  } catch (error) { console.error('Admin reports error:', error); res.status(500).json({ error:'Failed to fetch reports' }); }
};

export const updateReportStatus = async (req, res) => {
  try {
    const status = String(req.body?.status || '');
    if (!['pending','reviewed','resolved','dismissed'].includes(status)) return res.status(400).json({ error:'Invalid report status' });
    const report = await prisma.report.update({ where:{ id:req.params.id }, data:{ status } });
    res.json(report);
  } catch (error) { console.error('Update report error:', error); res.status(500).json({ error:'Failed to update report' }); }
};

export const getBroadcasts = async (req, res) => {
  try {
    const broadcasts = await prisma.broadcast.findMany({ orderBy:{ createdAt:'desc' }, take:50 });
    res.json(broadcasts.map(b => ({ id:b.id, title:b.title, message:b.message, target:b.audience, recipientCount:b.recipientCount, time:b.createdAt })));
  } catch (error) { console.error('Broadcast list error:', error); res.status(500).json({ error:'Failed to fetch broadcasts' }); }
};

export const createBroadcast = async (req, res) => {
  try {
    const title = String(req.body?.title || '').trim().slice(0, 120);
    const message = String(req.body?.message || '').trim().slice(0, 2000);
    const audience = String(req.body?.targetAudience || 'all_users');
    if (!title || !message) return res.status(400).json({ error:'Title and message are required' });
    if (!['all_users','active_users','paid_users'].includes(audience)) return res.status(400).json({ error:'Invalid target audience' });
    const where = audience === 'active_users' ? { status:'active', role:'user' } : audience === 'paid_users' ? { role:'user', monetizationStatus:'approved' } : { role:'user' };
    const recipients = await prisma.user.findMany({ where, select:{ id:true } });
    const broadcast = await prisma.broadcast.create({ data:{ senderId:req.userId, title, message, audience, recipientCount:recipients.length } });
    if (recipients.length) {
      await prisma.notification.createMany({ data: recipients.map(u => ({ receiverId:u.id, senderId:req.userId, type:'broadcast', message:`${title}: ${message}` })) });
    }
    res.status(201).json({ id:broadcast.id, title, message, target:audience, recipientCount:recipients.length, time:broadcast.createdAt });
  } catch (error) { console.error('Create broadcast error:', error); res.status(500).json({ error:'Failed to send broadcast' }); }
};
