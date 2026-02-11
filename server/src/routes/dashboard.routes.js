import express from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/stats', protect, authorize('provider'), getDashboardStats);

export default router;
