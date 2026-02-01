import express from 'express';
import { createPaymentIntent, confirmPayment } from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/create-intent', createPaymentIntent);
router.post('/confirm', confirmPayment);

// Stripe Connect
router.post('/connect/create-account', (await import('../controllers/payment.controller.js')).createConnectAccount);
router.post('/connect/onboarding-link', (await import('../controllers/payment.controller.js')).getAccountLink);
router.get('/connect/status', (await import('../controllers/payment.controller.js')).getPaymentStatus);

export default router;
