import { Router } from 'express';
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ message: 'Invalid user id.' });
    const other = await User.exists({ _id: userId });
    if (!other) return res.status(404).json({ message: 'User not found.' });
    const messages = await Message.find({
      $or: [
        { sender: req.userId, recipient: userId },
        { sender: userId, recipient: req.userId }
      ]
    }).sort({ createdAt: 1 }).limit(500).populate('sender', 'username avatarColor').lean();
    res.json({ messages: messages.map(m => ({ id: m._id, senderId: String(m.sender._id), sender: m.sender.username, avatarColor: m.sender.avatarColor, recipientId: String(m.recipient), text: m.text, createdAt: m.createdAt })) });
  } catch (err) { next(err); }
});

export default router;
