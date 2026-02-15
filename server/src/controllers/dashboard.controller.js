import Listing from '../models/Listing.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Tenant from '../models/tenant.model.js'; // Use correct filename from previous context if needed, usually 'tenant.model.js'
// Note: Assuming 'tenant.model.js' is the file. If import fails, we check file list again.

// @desc    Get Main Dashboard Stats
// @route   GET /api/dashboard/stats
// @access  Private (Provider)
export const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Listings & Rooms Stats
        const listings = await Listing.find({ provider: userId }).select('rooms title _id location');
        let totalRooms = 0;
        let occupiedRooms = 0;
        let totalBeds = 0; // If you track beds

        listings.forEach(listing => {
            if (listing.rooms && listing.rooms.length > 0) {
                totalRooms += listing.rooms.length;
                occupiedRooms += listing.rooms.filter(r => r.status === 'Occupied').length;
            }
        });

        const vacantRooms = totalRooms - occupiedRooms;
        const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

        // 2. Active Tenants
        const activeTenantsCount = await Tenant.countDocuments({
            providerId: userId,
            status: { $in: ['active', 'Active'] }
        });

        // 3. Pending Actions (Action Center)
        // a. Pending Bookings
        const pendingBookings = await Booking.find({
            provider: userId,
            status: 'pending'
        }).populate('seeker', 'name').select('createdAt');

        // b. Unread Messages 
        const Message = (await import('../models/Conversation.js')).Message;
        const unreadMessagesCount = await Message.countDocuments({
            // Assuming 'readBy' array doesn't contain user ID
            // And user is part of the conversation (checked via Conversation model usually, but simplified here)
            // Better: Find conversations where user is participant, then find messages in those convos not read by user.
            // Simplified for performance: Find messages where 'readBy' does not include user ID, 
            // BUT we need to make sure the message was intended for them (i.e. they are receiver).
            // Current Message schema has 'conversation' ref and 'sender' ref.
            // It doesn't explicit have 'receiver'. 
            // So we need to find conversations user is in, then find unread messages in them.

            // For now, let's use a simpler heuristic if possible or do the standard query:
            readBy: { $ne: userId },
            sender: { $ne: userId } // Don't count own messages
        }).limit(100); // Limit to avoid scanning whole DB if huge 

        // Refined Query: 
        // 1. Find conversations for user
        const Conversation = (await import('../models/Conversation.js')).Conversation;
        const userConversations = await Conversation.find({ participants: userId }).select('_id');
        const conversationIds = userConversations.map(c => c._id);

        const realUnreadCount = await Message.countDocuments({
            conversation: { $in: conversationIds },
            sender: { $ne: userId },
            readBy: { $ne: userId }
        });

        // c. Pending Tenant Approvals
        const pendingTenants = await Tenant.find({
            providerId: userId,
            status: 'Pending'
        }).select('name');

        const actionItems = [
            ...pendingBookings.map(b => ({
                type: 'booking',
                message: `New booking request from ${b.seeker?.name || 'Guest'}`,
                link: '/inquiries/bookings', // Corrected path
                urgent: true,
                date: b.createdAt
            })),
            ...(realUnreadCount > 0 ? [{
                type: 'message',
                message: `You have ${realUnreadCount} unread message${realUnreadCount > 1 ? 's' : ''}`,
                link: '/inquiries/inbox', // Corrected path
                urgent: false,
                date: new Date()
            }] : []),
            ...pendingTenants.map(t => ({
                type: 'tenant',
                message: `Tenant verification needed: ${t.name}`,
                link: '/approvals', // Corrected: Pending approvals page
                urgent: true,
                date: new Date()
            }))
        ];

        // 4. Quick Financials (This Month)
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const thisMonthRevenue = await Payment.aggregate([
            {
                $match: {
                    payee: req.user._id,
                    status: 'completed',
                    createdAt: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);
        const revenue = thisMonthRevenue[0]?.total || 0;

        res.json({
            success: true,
            stats: {
                occupancyRate,
                totalRooms,
                vacantRooms,
                activeTenants: activeTenantsCount,
                thisMonthRevenue: revenue
            },
            actions: actionItems.slice(0, 5) // Top 5 actions
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
