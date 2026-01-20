import express from 'express';
import { createTenant, generateAgreement } from '../controllers/tenant.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js'; 

const router = express.Router();

router.post('/', protect, authorize('provider'), createTenant);
router.post('/:id/agreement', protect, authorize('provider'), generateAgreement);

export default router;
