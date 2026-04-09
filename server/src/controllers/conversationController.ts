import { Response } from 'express';
import Conversation from '../models/Conversation';
import { AuthRequest } from '../types';

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const conversations = await Conversation.find({
      participants: req.user!.userId,
    })
      .populate('participants', 'displayName email profilePhotoUrl')
      .sort({ 'lastMessage.timestamp': -1, updatedAt: -1 });

    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { participantId } = req.body;
    const userId = req.user!.userId;

    if (participantId === userId) {
      res.status(400).json({ error: 'Cannot create conversation with yourself' });
      return;
    }

    const existing = await Conversation.findOne({
      participants: { $all: [userId, participantId], $size: 2 },
    }).populate('participants', 'displayName email profilePhotoUrl');

    if (existing) {
      res.json({ conversation: existing });
      return;
    }

    const conversation = await Conversation.create({
      participants: [userId, participantId],
      lastMessage: null,
    });

    const populated = await conversation.populate('participants', 'displayName email profilePhotoUrl');
    res.status(201).json({ conversation: populated });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user!.userId,
    }).populate('participants', 'displayName email profilePhotoUrl');

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
