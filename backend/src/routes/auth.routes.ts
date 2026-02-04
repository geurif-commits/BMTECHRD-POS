import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { licenseCheck } from '../middleware/licenseCheck.js';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login);
router.post('/logout', authenticate, licenseCheck, authController.logout);
router.get('/me', authenticate, licenseCheck, authController.me);
router.put('/change-pin', authenticate, licenseCheck, authController.changePin);

export default router;
