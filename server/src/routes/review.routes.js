import express from 'express';
import { createReview, getListingReviews } from '../controllers/review.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createReview);
router.get('/listing/:listingId', getListingReviews);

export default router;
