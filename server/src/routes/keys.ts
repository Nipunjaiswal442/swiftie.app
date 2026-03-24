import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { uploadBundle, getBundle, replenishKeys } from '../controllers/keyController';

const router = Router();

router.use(authMiddleware as any);

router.post('/bundle', uploadBundle as any);
router.get('/bundle/:userId', getBundle as any);
router.post('/replenish', replenishKeys as any);

export default router;
