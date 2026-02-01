import Report from '../models/Report.js';
import Listing from '../models/Listing.js';

// @desc    Create a report
// @route   POST /api/reports
// @access  Private
export const createReport = async (req, res) => {
    try {
        const { listingId, reason, description } = req.body;

        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ success: false, message: 'Listing not found' });
        }

        const report = await Report.create({
            reporter: req.user.id,
            listing: listingId,
            reason,
            description
        });

        res.status(201).json({
            success: true,
            message: 'Report submitted successfully',
            data: report
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
