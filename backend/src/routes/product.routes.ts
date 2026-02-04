import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { RecipeController } from '../controllers/recipe.controller.js';
import { authenticate } from '../middleware/auth.js';
import { licenseCheck } from '../middleware/licenseCheck.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();
const productController = new ProductController();
const recipeController = new RecipeController();

router.use(authenticate);
router.use(licenseCheck);

router.get('/categories', productController.listCategories);
router.get('/', productController.list);
router.get('/:id', productController.getById);
router.post('/', authorize(['ADMIN']), productController.create);
router.patch('/:id', authorize(['ADMIN']), productController.update);

// Recipe routes
router.get('/:id/recipe', recipeController.getByProduct);
router.post('/:id/recipe', authorize(['ADMIN']), recipeController.update);

export default router;
