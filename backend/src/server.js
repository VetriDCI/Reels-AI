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
import followRoutes from './routes/followRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import prisma from './config/database.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const httpServer = createServer(app);
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'RA Social API is running',
    timestamp: new Date().toISOString()
  });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('join_chat', (chatId) => { socket.join(`chat:${chatId}`); });
  socket.on('send_message', (data) => { io.to(`chat:${data.chatId}`).emit('new_message', data); });
  socket.on('disconnect', () => { console.log('User disconnected:', socket.id); });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => res.json({ success: true, message: 'RA Social API is running' }));

// Auto-create the default admin account on startup if it doesn't exist yet.
// This runs safely on every boot (idempotent — checks first) so it works
// even on hosting plans without shell/SSH access (e.g. Render free tier).
async function ensureDefaultAdmin() {
  try {
    const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@rasocial.com';
    const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';

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