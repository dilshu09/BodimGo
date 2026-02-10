import express from 'express';
import { createTenant, generateAgreement, getTenants } from '../controllers/tenant.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, authorize('provider'), getTenants);
router.post('/', protect, authorize('provider'), createTenant);
router.post('/:id/agreement', protect, authorize('provider'), generateAgreement);
router.patch('/:id/status', protect, authorize('provider'), (await import('../controllers/tenant.controller.js')).updateTenantStatus);
router.patch('/:id', protect, authorize('provider'), (await import('../controllers/tenant.controller.js')).updateTenant);

export default router;
