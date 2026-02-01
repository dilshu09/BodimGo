import Review from '../models/Review.js';
import Listing from '../models/Listing.js';
import mongoose from 'mongoose';

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private (Seeker)
export const createReview = async (req, res) => {
    try {
        const { listingId, rating, comment, subRatings } = req.body;

        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ success: false, message: 'Listing not found' });
        }

        // Check if user already reviewed
        const existingReview = await Review.findOne({
            author: req.user.id,
            targetListing: listingId
        });

        if (existingReview) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this listing' });
        }

        const review = await Review.create({
            author: req.user.id,
            targetListing: listingId,
            rating,
            comment,
            subRatings
        });

        // Update Listing Stats
        const stats = await Review.aggregate([
            { $match: { targetListing: new mongoose.Types.ObjectId(listingId) } },
            {
                $group: {
                    _id: '$targetListing',
                    averageRating: { $avg: '$rating' },
                    reviewCount: { $sum: 1 }
                }
            }
        ]);

        if (stats.length > 0) {
            await Listing.findByIdAndUpdate(listingId, {
                stats: {
                    averageRating: stats[0].averageRating.toFixed(1),
                    reviewCount: stats[0].reviewCount
                }
            });
        }

        res.status(201).json({
            success: true,
            data: review
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get reviews for a listing
// @route   GET /api/reviews/listing/:listingId
// @access  Public
export const getListingReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ targetListing: req.params.listingId })
            .populate('author', 'name profileImage') // Assuming User has name/profileImage
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
