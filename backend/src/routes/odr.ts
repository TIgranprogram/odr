import { Router } from 'express';
import * as OdrController from '../controllers/odr.controller';

const router = Router();

router.get('/', OdrController.getReport);
router.get('/summary', OdrController.getSummary);

export default router;
