import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } }).select('username email avatarColor lastSeen').sort({ username: 1 }).limit(200).lean();
    res.json({ users: users.map(u => ({ id: u._id, username: u.username, email: u.email, avatarColor: u.avatarColor, lastSeen: u.lastSeen })) });
  } catch (err) { next(err); }
});

export default router;
