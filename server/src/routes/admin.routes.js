import express from 'express';
import { getAllUsers, verifyProvider, getModerationQueue, moderateListing } from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require Admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/users', getAllUsers);
router.put('/providers/:id/verify', verifyProvider);

router.get('/listings/moderation', getModerationQueue);
router.put('/listings/:id/action', moderateListing);

export default router;
