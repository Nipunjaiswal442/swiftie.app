import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { Message } from '../models/Message';
import { Conversation, buildConversationId } from '../models/Conversation';

export const messagesRouter = Router();
messagesRouter.use(authMiddleware);

/** GET /api/v1/conversations */
messagesRouter.get('/conversations', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const convos = await Conversation.find({ participants: req.user!.userId })
      .sort({ updatedAt: -1 })
      .populate('participants', 'displayName username profilePhotoUrl isOnline lastSeen');
    res.json({ success: true, data: convos });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch conversations' });
  }
});

/** GET /api/v1/conversations/:id/messages */
messagesRouter.get('/conversations/:id/messages', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = 50;

    const messages = await Message.find({
      conversationId: req.params.id,
      isDeleted: false,
    })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ timestamp: 1 });

    res.json({ success: true, data: messages });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

/** POST /api/v1/messages — REST fallback (Socket.IO is preferred) */
messagesRouter.post('/messages', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { recipientId, ciphertext, messageType, senderRatchetKey, messageNumber, previousChainLength } =
      req.body as {
        recipientId: string; ciphertext: string; messageType?: 'text' | 'image';
        senderRatchetKey?: string; messageNumber?: number; previousChainLength?: number;
      };

    if (!recipientId || !ciphertext) {
      res.status(400).json({ success: false, error: 'recipientId and ciphertext are required' }); return;
    }

    const conversationId = buildConversationId(req.user!.userId, recipientId);

    const message = await Message.create({
      conversationId,
      sender: req.user!.userId,
      recipient: recipientId,
      ciphertext,
      messageType: messageType || 'text',
      senderRatchetKey: senderRatchetKey || '',
      messageNumber: messageNumber || 0,
      previousChainLength: previousChainLength || 0,
    });

    await Conversation.findOneAndUpdate(
      { conversationId },
      {
        $setOnInsert: { participants: [req.user!.userId, recipientId], conversationId },
        $set: { lastMessage: { ciphertext, sender: req.user!.userId, timestamp: message.timestamp } },
        $inc: { [`unreadCount.${recipientId}`]: 1 },
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, data: message });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

/** PUT /api/v1/messages/:id/read */
messagesRouter.put('/messages/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { $set: { readAt: new Date() } },
      { new: true }
    );
    if (!message) { res.status(404).json({ success: false, error: 'Message not found' }); return; }
    res.json({ success: true, data: message });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to mark as read' });
  }
});
