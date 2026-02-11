import express from 'express';
import { getMonthlyReport, getAnnualReport } from '../controllers/finance.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/monthly', protect, authorize('provider'), getMonthlyReport);
router.get('/annual', protect, authorize('provider'), getAnnualReport);

export default router;
