import express from 'express';
import { createBooking, getMyBookings, getBookingById, updateBookingStatus, deleteBooking, payBooking } from '../controllers/booking.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('seeker'), createBooking);
router.get('/', getMyBookings);
router.get('/:id', getBookingById);
router.put('/:id/status', updateBookingStatus);
router.put('/:id/pay', payBooking);
router.delete('/:id', deleteBooking);

export default router;
