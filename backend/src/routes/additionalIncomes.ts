import { Router } from 'express';
import * as AdditionalIncomeController from '../controllers/additionalIncome.controller';

const router = Router();

router.get('/', AdditionalIncomeController.getAll);
router.get('/:id', AdditionalIncomeController.getById);
router.post('/', AdditionalIncomeController.create);
router.put('/:id', AdditionalIncomeController.update);
router.delete('/:id', AdditionalIncomeController.remove);

export default router;
