import { Router } from 'express';
import { CashController } from '../controllers/cash.controller.js';
import { authenticate } from '../middleware/auth.js';
import { licenseCheck } from '../middleware/licenseCheck.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();
const cashController = new CashController();

router.use(authenticate);
router.use(licenseCheck);

router.get('/status', authorize(['CAJERO', 'ADMIN', 'SUPERVISOR', 'OWNER']), cashController.getStatus);
router.post('/open', authorize(['CAJERO', 'ADMIN', 'SUPERVISOR', 'OWNER']), cashController.open);
router.post('/close/:id', authorize(['CAJERO', 'ADMIN', 'SUPERVISOR', 'OWNER']), cashController.close);
router.post('/expenses', authorize(['CAJERO', 'ADMIN', 'SUPERVISOR', 'OWNER']), cashController.addExpense);

export default router;
