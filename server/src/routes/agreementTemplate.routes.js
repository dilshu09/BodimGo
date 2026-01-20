import express from 'express';
import { createTemplate, getMyTemplates, getTemplateById, updateTemplate, deleteTemplate } from '../controllers/agreementTemplate.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('provider', 'admin'));

router.post('/', createTemplate);
router.get('/', getMyTemplates);
router.get('/:id', getTemplateById);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

export default router;
