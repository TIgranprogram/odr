import { Router } from 'express';
import * as StockItemController from '../controllers/stockItem.controller';

const router = Router();

router.get('/', StockItemController.getAll);
router.post('/', StockItemController.create);
router.get('/:id', StockItemController.findById);
router.put('/:id', StockItemController.update);

export default router;
