import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import messageRoutes from './routes/messages.js';
import Message from './models/Message.js';
import User from './models/User.js';
import jwt from 'jsonwebtoken';

const required = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters long.');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL, methods: ['GET', 'POST'] } });
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json({ limit: '20kb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false }), authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use((err, _req, res, _next) => {
  if (err.code === 11000) return res.status(409).json({ message: 'Email or username is already registered.' });
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error.' });
});

const online = new Map();
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    socket.userId = jwt.verify(token, process.env.JWT_SECRET).sub;
    next();
  } catch { next(new Error('Invalid or expired session')); }
});

io.on('connection', async (socket) => {
  const userId = String(socket.userId);
  const count = online.get(userId) || 0;
  online.set(userId, count + 1);
  socket.join(`user:${userId}`);
  if (count === 0) io.emit('presence:update', { userId, online: true });
  socket.emit('presence:snapshot', [...online.keys()]);

  socket.on('message:send', async (payload, ack = () => {}) => {
    try {
      const recipientId = String(payload?.recipientId || '');
      const text = String(payload?.text || '').trim();
      if (!mongoose.isValidObjectId(recipientId) || recipientId === userId) return ack({ error: 'Choose a valid recipient.' });
      if (!text || text.length > 4000) return ack({ error: 'Messages must be 1–4000 characters.' });
      if (!(await User.exists({ _id: recipientId }))) return ack({ error: 'Recipient not found.' });
      const message = await Message.create({ sender: userId, recipient: recipientId, text });
      const sender = await User.findById(userId).select('username avatarColor').lean();
      const dto = { id: String(message._id), senderId: userId, sender: sender.username, avatarColor: sender.avatarColor, recipientId, text, createdAt: message.createdAt };
      io.to(`user:${userId}`).to(`user:${recipientId}`).emit('message:new', dto);
      ack({ message: dto });
    } catch (error) {
      console.error('Message send failed:', error.message);
      ack({ error: 'Could not send message.' });
    }
  });

  socket.on('typing:set', ({ recipientId, typing } = {}) => {
    if (mongoose.isValidObjectId(recipientId) && String(recipientId) !== userId) {
      io.to(`user:${recipientId}`).emit('typing:update', { userId, typing: Boolean(typing) });
    }
  });

  socket.on('disconnect', async () => {
    const remaining = (online.get(userId) || 1) - 1;
    if (remaining <= 0) {
      online.delete(userId);
      io.emit('presence:update', { userId, online: false });
      await User.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch(() => {});
    } else online.set(userId, remaining);
  });
});

const start = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const port = Number(process.env.PORT || 4000);
  server.listen(port, () => console.log(`Chat API and Socket.IO listening on port ${port}`));
};
start().catch((error) => { console.error('Startup failed:', error); process.exit(1); });
