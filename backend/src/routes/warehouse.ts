import { Router } from 'express';
import * as WarehouseController from '../controllers/warehouse.controller';

const router = Router();

router.get('/', WarehouseController.getAll);
router.post('/', WarehouseController.create);
router.get('/:id', WarehouseController.findById);
router.put('/:id', WarehouseController.update);
router.delete('/:id', WarehouseController.remove);

export default router;
