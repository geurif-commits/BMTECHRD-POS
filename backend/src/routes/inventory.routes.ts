import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller.js';
import { authenticate } from '../middleware/auth.js';
import { licenseCheck } from '../middleware/licenseCheck.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();
const inventoryController = new InventoryController();

router.use(authenticate);
router.use(licenseCheck);

router.get('/', authorize(['ADMIN', 'OWNER', 'SUPERVISOR', 'CAMARERO', 'BARTENDER']), inventoryController.list);
router.get('/low-stock', authorize(['ADMIN', 'OWNER', 'SUPERVISOR', 'CAMARERO', 'BARTENDER']), inventoryController.lowStock);
router.patch('/:productId', authorize(['ADMIN', 'OWNER', 'CAMARERO', 'BARTENDER']), inventoryController.update);

export default router;
