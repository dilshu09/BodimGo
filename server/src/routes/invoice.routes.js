import express from 'express';
import { createManualInvoice, getProviderInvoices, markInvoiceAsPaid } from '../controllers/invoice.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('provider'));

router.post('/', createManualInvoice);
router.get('/', getProviderInvoices);
router.put('/:id/pay', markInvoiceAsPaid);

export default router;
