import express from 'express';
import { createReport, getReports, resolveReport } from '../controllers/report.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protect, authorize('seeker'), createReport);
router.get('/', protect, getReports);
router.put('/:id/resolve', protect, resolveReport);

export default router;
