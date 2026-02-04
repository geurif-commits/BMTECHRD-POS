import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.js';
import { licenseCheck } from '../middleware/licenseCheck.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();
const dashboardController = new DashboardController();

router.use(authenticate);
router.use(licenseCheck);

router.get('/sales/today', authorize(['OWNER', 'ADMIN']), dashboardController.salesToday);
router.get('/sales/by-waiter', authorize(['OWNER', 'ADMIN']), dashboardController.salesByWaiter);
router.get('/sales/by-product', authorize(['OWNER', 'ADMIN']), dashboardController.salesByProduct);
router.get('/sales/by-hour', authorize(['OWNER', 'ADMIN']), dashboardController.salesByHour);
router.get('/kpis', authorize(['OWNER', 'ADMIN']), dashboardController.kpis);

export default router;
