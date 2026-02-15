import express from 'express';
import { getAllUsers, verifyProvider, getModerationQueue, moderateListing, getDashboardStats, suspendUser, deleteUser, getUserById, updateUser, warnUser, contactProvider, getProviderListings } from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require Admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/users', getAllUsers);
router.put('/providers/:id/verify', verifyProvider);
router.post('/providers/contact', contactProvider);
router.get('/providers/:id/listings', getProviderListings);

router.get('/listings/moderation', getModerationQueue);
router.put('/listings/:id/action', moderateListing);
router.get('/stats', getDashboardStats);

router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.put('/users/:id/suspend', suspendUser);
router.post('/users/:id/warn', warnUser);
router.delete('/users/:id', deleteUser);


export default router;
