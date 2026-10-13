import { Router } from 'express';
import * as AuditController from '../controllers/audit.controller';

const router = Router();

router.get('/', AuditController.getPaged);

export default router;
