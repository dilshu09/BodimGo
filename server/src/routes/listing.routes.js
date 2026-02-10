import express from 'express';
import { createListing, getListings, getListingById, getMyListings, updateListing, getAllProviderRooms, updateRoomStatus } from '../controllers/listing.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(getListings)
  .post(protect, authorize('provider', 'admin'), createListing);

router.get('/my', protect, authorize('provider'), getMyListings);

router.get('/provider/rooms', protect, authorize('provider'), getAllProviderRooms);
router.get('/dashboard/stats', protect, authorize('provider'), (await import('../controllers/listing.controller.js')).getDashboardStats);
router.get('/pending-approvals', protect, authorize('provider'), (await import('../controllers/listing.controller.js')).getPendingApprovals);
router.post('/provider/rooms', protect, authorize('provider'), (await import('../controllers/listing.controller.js')).addRoom);
router.put('/provider/rooms/:roomId', protect, authorize('provider'), (await import('../controllers/listing.controller.js')).updateRoom);
router.delete('/provider/rooms/:roomId', protect, authorize('provider'), (await import('../controllers/listing.controller.js')).deleteRoom);
router.put('/provider/rooms/:roomId/status', protect, authorize('provider'), updateRoomStatus);

router.route('/:id')
  .get(getListingById)
  .put(protect, authorize('provider', 'admin'), updateListing);

export default router;
