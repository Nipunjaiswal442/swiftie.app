import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getMe, updateMe, searchUsers, getUserById } from '../controllers/userController';

const router = Router();

router.use(authMiddleware as any);

router.get('/me', getMe as any);
router.put('/me', updateMe as any);
router.get('/search', searchUsers as any);
router.get('/:id', getUserById as any);

export default router;
