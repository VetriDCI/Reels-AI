import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import vibeRoutes from './routes/vibeRoutes.js';
import { cleanupExpiredVibes } from './controllers/vibeController.js';
import followRoutes from './routes/followRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import monetizationRoutes from './routes/monetizationRoutes.js';
import payoutRoutes from './routes/payoutRoutes.js';
import userSafetyRoutes from './routes/userSafetyRoutes.js';
import userRoutes from './routes/userRoutes.js';
import savedPostRoutes from './routes/savedPostRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import adRoutes from './routes/adRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import watchHistoryRoutes from './routes/watchHistoryRoutes.js';
import { cleanupOldWatchHistory } from './controllers/watchHistoryController.js';
import prisma from './config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.set('trust proxy', 1);

// Baseline security headers without adding another runtime dependency.
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  res.setHeader('X-XSS-Protection', '0');
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});
const httpServer = createServer(app);
const onlineUsers = new Map();
const io = new Server(httpServer, {
  cors: {
    origin: (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(v => v.trim()).filter(Boolean),
    methods: ['GET', 'POST']
  }
});

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(v => v.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️ JWT_SECRET is missing or shorter than 32 characters. Configure a strong secret in production.');
}

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/vibes', vibeRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/monetization', monetizationRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/user-safety', userSafetyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/saved-posts', savedPostRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/watch-history', watchHistoryRoutes);
app.set('io', io);

app.get('/api/health', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    success: true,
    message: 'RA Social API is running',
    timestamp: new Date().toISOString()
  });
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.jti) {
      const session = await prisma.session.findFirst({ where: { tokenId: decoded.jti, userId: decoded.userId, revokedAt: null, expiresAt: { gt: new Date() } }, select: { id: true } });
      if (!session) return next(new Error('Session expired or logged out'));
    }
    socket.userId = decoded.userId;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  const wasOnline = onlineUsers.has(socket.userId);
  onlineUsers.set(socket.userId, (onlineUsers.get(socket.userId) || 0) + 1);
  if (!wasOnline) io.emit('user_presence', { userId: socket.userId, online: true });
  socket.emit('presence_snapshot', { userIds: Array.from(onlineUsers.keys()) });

  socket.on('join_chat', async (chatId) => {
    try {
      if (!chatId) return;
      const chat = await prisma.chat.findUnique({ where: { id: chatId }, select: { participants: { where: { id: socket.userId }, select: { id: true } } } });
      if (chat?.participants?.length) socket.join(`chat:${chatId}`);
    } catch (error) { console.error('Socket chat join error:', error.message); }
  });

  socket.on('typing', async ({ chatId, isTyping }) => {
    try {
      if (!chatId) return;
      const chat = await prisma.chat.findFirst({ where: { id: chatId, participants: { some: { id: socket.userId } } }, select: { id: true } });
      if (chat) socket.to(`chat:${chatId}`).emit('typing', { chatId, userId: socket.userId, isTyping: Boolean(isTyping) });
    } catch (error) { console.error('Socket typing error:', error.message); }
  });

  socket.on('disconnect', () => {
    const count = (onlineUsers.get(socket.userId) || 1) - 1;
    if (count <= 0) { onlineUsers.delete(socket.userId); io.emit('user_presence', { userId: socket.userId, online: false }); }
    else onlineUsers.set(socket.userId, count);
    console.log('User disconnected:', socket.id);
  });
});

app.use((err, req, res, next) => {
  const status = Number(err?.status || err?.statusCode) || 500;
  console.error('Request error', { requestId: req.requestId, method: req.method, path: req.path, status, message: err?.message });
  if (res.headersSent) return next(err);
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'File is too large. Maximum size is 50 MB.', requestId: req.requestId });
  }
  if (err?.name === 'MulterError') {
    return res.status(400).json({ success: false, message: 'Invalid upload request.', requestId: req.requestId });
  }
  if (err?.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'Origin is not allowed.', requestId: req.requestId });
  }
  const safeMessage = status >= 500 ? 'Something went wrong. Please try again.' : (err?.message || 'Request failed.');
  res.status(status).json({ success: false, message: safeMessage, requestId: req.requestId });
});

const PORT = process.env.PORT || 5000;

// Avoid leaving timers and database connections behind during platform restarts.
let shuttingDown = false;
const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}; shutting down gracefully...`);
  clearInterval(vibeCleanupInterval);
  clearInterval(historyCleanupInterval);
  httpServer.close(async () => {
    try { await prisma.$disconnect(); } catch (error) { console.error('Prisma disconnect error:', error); }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => console.error('Unhandled promise rejection:', reason));
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  shutdown('uncaughtException').catch(() => process.exit(1));
});

// Keep expired 24-hour Vibes cleaned up even when nobody opens the Chat page.
const vibeCleanupInterval = setInterval(() => cleanupExpiredVibes().catch((error) => console.error('Vibe cleanup error:', error)), 10 * 60 * 1000);
cleanupExpiredVibes().catch((error) => console.error('Initial Vibe cleanup error:', error));
cleanupOldWatchHistory().catch((error) => console.error('Initial watch-history cleanup error:', error));
const historyCleanupInterval = setInterval(() => cleanupOldWatchHistory().catch((error) => console.error('Watch-history cleanup error:', error)), 60 * 60 * 1000);

app.get('/', (req, res) => res.json({ success: true, message: 'RA Social API is running' }));

// Keep unknown API routes from falling through to an HTML/error response.
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found', requestId: req.requestId });
});

// Auto-create the default admin account on startup if it doesn't exist yet.
// This runs safely on every boot (idempotent — checks first) so it works
// even on hosting plans without shell/SSH access (e.g. Render free tier).
async function ensureDefaultAdmin() {
  try {
    const email = process.env.DEFAULT_ADMIN_EMAIL;
    const password = process.env.DEFAULT_ADMIN_PASSWORD;

    // Never create a production admin with a hard-coded password.
    // Configure DEFAULT_ADMIN_EMAIL/PASSWORD on the hosting provider when
    // an initial admin account needs to be bootstrapped.
    if (!email || !password) {
      console.log('ℹ️  Default admin bootstrap skipped: DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD are not configured.');
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      if (existing.role !== 'admin') {
        await prisma.user.update({ where: { email }, data: { role: 'admin' } });
        console.log(`✅ Promoted existing user to admin: ${email}`);
      }
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await prisma.user.create({
      data: {
        username: email.split('@')[0],
        email,
        passwordHash,
        fullName: 'Admin',
        role: 'admin',
        status: 'active',
      },
    });

    console.log(`✅ Default admin account created: ${email}`);
  } catch (error) {
    console.error('⚠️  Could not auto-create default admin (will retry on next deploy):', error.message);
  }
}

httpServer.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  await ensureDefaultAdmin();
});