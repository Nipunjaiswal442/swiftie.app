import { Response } from 'express';
import Message from '../models/Message';
import Conversation from '../models/Conversation';
import { AuthRequest } from '../types';

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before as string;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user!.userId,
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const query: Record<string, unknown> = { conversationId };
    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('senderId', 'displayName profilePhotoUrl');

    res.json({ messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
