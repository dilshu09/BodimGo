import express from 'express';
import { createReview, getListingReviews, getProviderReviews, replyReview } from '../controllers/review.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createReview);
router.get('/provider', protect, getProviderReviews);
router.get('/listing/:listingId', getListingReviews);
router.put('/:id/reply', protect, replyReview);

export default router;
