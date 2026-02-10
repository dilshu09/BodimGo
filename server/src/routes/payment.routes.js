import express from 'express';
import {
    createPaymentIntent,
    confirmPayment,
    createConnectAccount,
    getAccountLink,
    getPaymentStatus,
    getPaymentHistory,
    getPaymentStats
} from '../controllers/payment.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/create-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);

// Stripe Connect
router.post('/connect/create-account', protect, authorize('provider'), createConnectAccount);
router.post('/connect/onboarding-link', protect, authorize('provider'), getAccountLink);
router.get('/connect/status', protect, authorize('provider'), getPaymentStatus);

// Analytics & History
router.get('/history', protect, authorize('provider'), getPaymentHistory);
router.get('/stats', protect, authorize('provider'), getPaymentStats);

export default router;
