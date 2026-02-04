import { Router } from 'express';
import reportController from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.js';
import { licenseCheck } from '../middleware/licenseCheck.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();

router.use(authenticate);
router.use(licenseCheck);

// Only owner/admin can request reports
router.get('/sales', authorize(['OWNER', 'ADMIN']), reportController.sales);

export default router;
