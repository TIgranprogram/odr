import { Router } from 'express';
import * as DictionaryController from '../controllers/dictionary.controller';

const router = Router();

router.get('/', DictionaryController.getAll);
router.get('/:category', DictionaryController.getByCategory);
router.post('/', DictionaryController.createItem);
router.put('/:id', DictionaryController.updateItem);
router.delete('/:id', DictionaryController.deleteItem);

export default router;
