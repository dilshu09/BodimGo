import Report from '../models/Report.js';
import Listing from '../models/Listing.js';
import { sendEmail } from '../utils/email.service.js';

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

        // Send automated acknowledgement to reporter
        try {
            await sendEmail(
                req.user.email,
                'We Received Your Report - BodimGo',
                `Hi ${req.user.name},\n\nThank you for looking out for our community. We have received your report against the listing "${listing.title}".\n\nOur team will review it shortly and take necessary action.\n\nBest Regards,\nBodimGo Team`
            );
        } catch (emailError) {
            console.error("Failed to send report acknowledgement email:", emailError);
            // Continue execution, don't fail the request
        }

        // --- NOTIFICATION TRIGGER ---
        try {
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
        } catch (notifError) {
            console.error("Failed to send admin notifications:", notifError);
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

// @desc    Get all reports
// @route   GET /api/reports
// @access  Private/Admin
export const getReports = async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('listing', 'title _id')
            .populate('reporter', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: reports });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Resolve a report
// @route   PUT /api/reports/:id/resolve
// @access  Private/Admin
export const resolveReport = async (req, res) => {
    try {
        console.log(`Resolving report with ID: ${req.params.id}`);
        const report = await Report.findById(req.params.id);

        if (!report) {
            console.log('Report not found in DB');
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        report.status = 'Resolved';
        await report.save();
        console.log('Report resolved successfully');

        res.status(200).json({ success: true, data: report, message: 'Report resolved' });
    } catch (error) {
        console.error('Error resolving report:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
