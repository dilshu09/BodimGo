import ViewingRequest from '../models/ViewingRequest.js';
import Listing from '../models/Listing.js';
import { createNotification } from './notification.controller.js';

// @desc    Create a new viewing request
// @route   POST /api/viewing-requests
// @access  Private (Seeker)
export const createViewingRequest = async (req, res) => {
    try {
        const { listingId, date, time, note } = req.body;

        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        const viewingRequest = await ViewingRequest.create({
            seeker: req.user._id,
            provider: listing.provider,
            listing: listingId,
            date,
            time,
            note
        });

        const populatedRequest = await ViewingRequest.findById(viewingRequest._id)
            .populate('seeker', 'name')
            .populate('listing', 'title');

        // Notify Provider
        await createNotification({
            recipient: listing.provider,
            type: 'viewing_request',
            title: 'New Viewing Request',
            message: `${populatedRequest.seeker.name} has requested a viewing for ${populatedRequest.listing.title}`,
            data: { viewingRequestId: viewingRequest._id, listingId: listing._id }
        });

        res.status(201).json(viewingRequest);
    } catch (error) {
        console.error("Error creating viewing request:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get my viewing requests
// @route   GET /api/viewing-requests
// @access  Private
export const getViewingRequests = async (req, res) => {
    try {
        const role = req.user.role;
        let query = {};

        if (role === 'seeker') {
            query = { seeker: req.user._id };
        } else if (role === 'provider') {
            query = { provider: req.user._id };
        }

        const requests = await ViewingRequest.find(query)
            .populate('listing', 'title images location')
            .populate('seeker', 'name email phone')
            .populate('provider', 'name email phone')
            .sort({ createdAt: -1 });


        res.json(requests);
    } catch (error) {
        console.error("Error fetching viewing requests:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update viewing request status
// @route   PUT /api/viewing-requests/:id/status
// @access  Private (Provider)
export const updateViewingRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['accepted', 'rejected', 'completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const viewingRequest = await ViewingRequest.findById(id).populate('seeker', 'name email').populate('listing', 'title');
        if (!viewingRequest) {
            return res.status(404).json({ message: 'Viewing request not found' });
        }

        // Verify provider ownership
        if (viewingRequest.provider.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        viewingRequest.status = status;
        await viewingRequest.save();

        // Notify Seeker
        await createNotification({
            recipient: viewingRequest.seeker._id,
            type: 'viewing_update',
            title: 'Viewing Request Updated',
            message: `Your viewing request for ${viewingRequest.listing.title} has been ${status}.`,
            data: { viewingRequestId: viewingRequest._id }
        });

        res.json(viewingRequest);
    } catch (error) {
        console.error("Error updating viewing request:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reply to viewing request
// @route   POST /api/viewing-requests/:id/reply
// @access  Private (Provider)
export const replyToViewingRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Reply message is required' });
        }

        const viewingRequest = await ViewingRequest.findById(id).populate('seeker', 'name email').populate('listing', 'title');
        if (!viewingRequest) {
            return res.status(404).json({ message: 'Viewing request not found' });
        }

        // Verify provider ownership
        if (viewingRequest.provider.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        viewingRequest.providerReply = message;
        await viewingRequest.save();

        // Notify Seeker
        await createNotification({
            recipient: viewingRequest.seeker._id,
            type: 'viewing_reply',
            title: 'New Reply from Provider',
            message: `Provider has replied to your viewing request for ${viewingRequest.listing.title}: "${message}"`,
            data: { viewingRequestId: viewingRequest._id }
        });

        res.json(viewingRequest);
    } catch (error) {
        console.error("Error replying to viewing request:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
// @desc    Cancel a viewing request
// @route   PUT /api/viewing-requests/:id/cancel
// @access  Private (Seeker)
export const cancelViewingRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const viewingRequest = await ViewingRequest.findById(id).populate('listing', 'title provider');

        if (!viewingRequest) {
            return res.status(404).json({ message: 'Viewing request not found' });
        }

        // Verify seeker ownership
        if (viewingRequest.seeker.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (viewingRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Can only cancel pending requests' });
        }

        viewingRequest.status = 'cancelled';
        await viewingRequest.save();

        // Notify Provider
        await createNotification({
            recipient: viewingRequest.listing.provider,
            type: 'viewing_update',
            title: 'Viewing Request Cancelled',
            message: `The viewing request for ${viewingRequest.listing.title} has been cancelled by the seeker.`,
            data: { viewingRequestId: viewingRequest._id }
        });

        res.json(viewingRequest);
    } catch (error) {
        console.error("Error cancelling viewing request:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
