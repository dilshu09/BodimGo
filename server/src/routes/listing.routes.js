import express from 'express';
import { createListing, getListings, getListingById, getMyListings, updateListing } from '../controllers/listing.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(getListings)
  .post(protect, authorize('provider', 'admin'), createListing);

router.get('/my', protect, authorize('provider'), getMyListings);

router.route('/:id')
  .get(getListingById)
  .put(protect, authorize('provider', 'admin'), updateListing);

export default router;
