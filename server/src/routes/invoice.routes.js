import express from 'express';
import { createManualInvoice, getProviderInvoices } from '../controllers/invoice.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('provider'));

router.post('/', createManualInvoice);
router.get('/', getProviderInvoices);

export default router;
