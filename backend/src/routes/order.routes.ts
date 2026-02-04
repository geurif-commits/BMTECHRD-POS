import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.js';
import { licenseCheck } from '../middleware/licenseCheck.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();
const orderController = new OrderController();

router.use(authenticate);
router.use(licenseCheck);

router.post('/', authorize(['ADMIN', 'SUPERVISOR', 'CAMARERO']), orderController.create);
router.get('/', orderController.list);
router.get('/kitchen', authorize(['COCINERO', 'ADMIN', 'SUPERVISOR']), orderController.getKitchenOrders);
router.get('/kitchen/summary', authorize(['COCINERO', 'ADMIN', 'SUPERVISOR']), orderController.getKitchenSummary);
router.get('/bar', authorize(['CAMARERO', 'BARTENDER', 'ADMIN', 'SUPERVISOR']), orderController.getBarOrders);
router.get('/bar/summary', authorize(['CAMARERO', 'BARTENDER', 'ADMIN', 'SUPERVISOR']), orderController.getBarSummary);
router.get('/served', authorize(['CAJERO', 'ADMIN', 'SUPERVISOR']), orderController.getServedOrders);
router.get('/:id', orderController.getById);
router.patch('/:id/items', authorize(['ADMIN', 'SUPERVISOR', 'CAMARERO']), orderController.updateItems);
router.post('/:id/send', authorize(['ADMIN', 'SUPERVISOR', 'CAMARERO']), orderController.sendOrder);
router.patch('/:id/item/:itemId/status', authorize(['COCINERO', 'CAMARERO', 'ADMIN', 'SUPERVISOR']), orderController.updateItemStatus);
router.patch('/:id/status', authorize(['CAJERO', 'ADMIN', 'SUPERVISOR']), orderController.updateStatus);
router.post('/:id/cancel', authorize(['ADMIN', 'SUPERVISOR', 'CAMARERO']), orderController.cancel);

export default router;
