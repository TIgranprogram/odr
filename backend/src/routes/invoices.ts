import { Router } from 'express';
import * as InvoiceController from '../controllers/invoice.controller';

const router = Router();

router.get('/', InvoiceController.getAll);
router.post('/', InvoiceController.create);
router.get('/:id', InvoiceController.findById);
router.put('/:id', InvoiceController.update);
router.delete('/:id', InvoiceController.remove);

export default router;
