import { Router } from 'express';
import * as InvoiceController from '../controllers/invoice.controller';
import * as OrderController from '../controllers/order.controller';

const router = Router();

router.get('/', InvoiceController.getAll);
router.post('/', InvoiceController.create);
router.get('/:id', InvoiceController.findById);
router.put('/:id', InvoiceController.update);

router.get('/', OrderController.getAll);
router.post('/', OrderController.create);
router.get('/:id', OrderController.findById);
router.put('/:id', OrderController.update);

export default router;
