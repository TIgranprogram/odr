import { Router } from 'express';
import * as ProductController from '../controllers/product.controller';

const router = Router();

router.get('/', ProductController.getAll);
router.get('/sku/:sku', ProductController.getBySku);
router.get('/:id', ProductController.getById);
router.post('/', ProductController.create);

export default router;
