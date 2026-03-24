import { Router } from 'express';
import { body } from 'express-validator';
import { googleAuth } from '../controllers/authController';

const router = Router();

router.post('/google', body('idToken').isString().notEmpty(), googleAuth);

export default router;
