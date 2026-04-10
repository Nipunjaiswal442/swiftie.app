import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getConversations,
  createConversation,
  getConversation,
} from '../controllers/conversationController';

const router = Router();

router.use(authMiddleware as any);

router.get('/', getConversations as any);
router.post('/', createConversation as any);
router.get('/:id', getConversation as any);

export default router;
