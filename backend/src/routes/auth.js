import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router = Router();
const publicUser = (user) => ({ id: user._id, username: user.username, email: user.email, avatarColor: user.avatarColor, lastSeen: user.lastSeen });

router.post('/register', async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (username.length < 2 || username.length > 24) return res.status(400).json({ message: 'Username must be 2–24 characters.' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 8 || password.length > 128) return res.status(400).json({ message: 'Password must be 8–128 characters.' });
    if (await User.exists({ $or: [{ email }, { username }] })) return res.status(409).json({ message: 'Email or username is already registered.' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email, passwordHash });
    res.status(201).json({ token: signToken(user.id), user: publicUser(user) });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Incorrect email or password.' });
    res.json({ token: signToken(user.id), user: publicUser(user) });
  } catch (err) { next(err); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: publicUser(user) });
  } catch (err) { next(err); }
});

export default router;
