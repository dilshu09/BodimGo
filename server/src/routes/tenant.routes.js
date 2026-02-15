import express from 'express';
import {
    createTenant,
    generateAgreement,
    getTenants,
    updateTenantStatus,
    updateTenant,
    getMyTenancy,
    requestMoveOut
} from '../controllers/tenant.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, authorize('provider'), getTenants);
router.post('/', protect, authorize('provider'), createTenant);
router.post('/:id/agreement', protect, authorize('provider'), generateAgreement);
router.patch('/:id/status', protect, authorize('provider'), updateTenantStatus);
router.patch('/:id', protect, authorize('provider'), updateTenant);

router.get('/my-tenancy', protect, getMyTenancy);
router.post('/move-out', protect, requestMoveOut);

export default router;
