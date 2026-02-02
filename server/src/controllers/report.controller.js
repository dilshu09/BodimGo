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

        // --- NOTIFICATION TRIGGER ---
        const { createNotification } = await import('./notification.controller.js');
        // Find Admins (Naive approach: find all users with role 'admin')
        const User = (await import('../models/User.js')).default;
        const admins = await User.find({ role: 'admin' });

        for (const admin of admins) {
            await createNotification({
                recipient: admin._id,
                type: 'report_filed',
                title: 'New Report Filed',
                message: `A report has been filed against a listing for: ${reason}`,
                data: { reportId: report._id, listingId: listingId }
            });
        }

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
