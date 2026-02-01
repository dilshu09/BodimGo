import express from 'express';
import { createBooking, getMyBookings, getBookingById, updateBookingStatus } from '../controllers/booking.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createBooking);
router.get('/', getMyBookings);
router.get('/:id', getBookingById);
router.put('/:id/status', updateBookingStatus);

export default router;
