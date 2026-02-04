import { Router } from 'express';
import { SuperAdminController } from '../controllers/superadmin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();
const superAdminController = new SuperAdminController();

router.use(authenticate);
// Restricted to ADMIN for now, ideally a specific SUPERADMIN role
router.use(authorize(['ADMIN', 'OWNER']));

router.get('/businesses', superAdminController.getBusinesses);
router.post('/businesses', superAdminController.createBusiness);
router.post('/licenses/generate', superAdminController.generateLicense);
router.get('/stats', superAdminController.getStats);
router.get('/landing-settings', superAdminController.getLandingSettings);
router.put('/landing-settings', superAdminController.updateLandingSettings);
router.get('/backup', superAdminController.backupDatabase);
router.get('/activation-requests', superAdminController.listActivationRequests);
router.post('/activation-requests/:id/approve', superAdminController.approveActivationRequest);

export default router;
