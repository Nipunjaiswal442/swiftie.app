import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getMessages } from '../controllers/messageController';

const router = Router();

router.use(authMiddleware as any);

router.get('/:conversationId/messages', getMessages as any);

export default router;
