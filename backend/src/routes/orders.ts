import { Router } from 'express';
import * as OrderController from '../controllers/order.controller';

const router = Router();

router.get('/', OrderController.getAll);
router.post('/', OrderController.create);
router.get('/:id', OrderController.findById);
router.put('/:id', OrderController.update);
router.delete('/:id', OrderController.remove);

export default router;
