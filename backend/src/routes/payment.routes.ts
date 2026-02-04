import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { licenseCheck } from '../middleware/licenseCheck.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();
const paymentController = new PaymentController();

router.use(authenticate);
router.use(licenseCheck);

router.post('/', authorize(['CAJERO', 'ADMIN', 'SUPERVISOR']), paymentController.create);
router.get('/history', authorize(['CAJERO', 'ADMIN', 'SUPERVISOR', 'OWNER']), paymentController.history);

export default router;
