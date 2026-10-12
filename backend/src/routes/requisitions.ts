import { Router } from 'express';
import * as RequisitionController from '../controllers/requisition.controller';

const router = Router();

router.get('/', RequisitionController.getAll);
router.post('/', RequisitionController.create);
router.get('/:id', RequisitionController.findById);
router.put('/:id', RequisitionController.update);
router.delete('/:id', RequisitionController.remove);

export default router;
