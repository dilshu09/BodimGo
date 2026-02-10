import User from '../models/User.js';
import ProviderProfile from '../models/ProviderProfile.js';
import Listing from '../models/Listing.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import { sendEmail } from '../utils/email.service.js';

// @desc    Get all users (with filters)
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify a provider
// @route   PUT /api/admin/providers/:id/verify
// @access  Private/Admin
export const verifyProvider = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'provider') {
      return res.status(404).json({ message: 'Provider not found' });
    }

    user.isVerified = true; // Use basic verification flag or specific KYC flag
    await user.save();

    // Update profile status
    await ProviderProfile.findOneAndUpdate(
      { user: user._id },
      { kycStatus: 'approved' }
    );

    res.json({ message: 'Provider verified successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get listings requiring moderation
// @route   GET /api/admin/listings/moderation
// @access  Private/Admin
export const getModerationQueue = async (req, res) => {
  try {
    const listings = await Listing.find({
      $or: [{ status: 'hidden_by_audit' }, { status: 'pending_review' }]
    })
      .populate('provider', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve or Reject Listing with Message
// @route   PUT /api/admin/listings/:id/action
// @access  Private/Admin
export const moderateListing = async (req, res) => {
  const { action, message } = req.body; // 'approve' or 'reject', optional 'message'

  try {
    const listing = await Listing.findById(req.params.id).populate('provider');
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const Ticket = (await import('../models/Ticket.js')).default;

    if (action === 'approve') {
      listing.status = 'active';
      listing.aiSafetyFlags = []; // Clear flags

      // Update Audit Log
      if (!listing.auditLog) listing.auditLog = [];
      listing.auditLog.push({
        action: 'approved',
        reason: message || 'Manual Approval by Admin',
        adminId: req.user._id,
        timestamp: new Date()
      });

      // Send Email
      if (listing.provider?.email) {
        const emailSubject = `Listing Approved: ${listing.title}`;
        const emailBody = `Good news! Your listing "${listing.title}" has been approved and is now live.${message ? `\n\nNote from Admin:\n${message}` : ''}`;
        await sendEmail(listing.provider.email, emailSubject, emailBody);
      }

      // Create System Ticket (Notification)
      if (message) {
        await Ticket.create({
          provider: listing.provider._id,
          subject: `Listing Approved: ${listing.title}`,
          message: message, // Admin message as the "ticket" content for now
          category: 'general',
          status: 'resolved',
          adminResponse: 'Approved'
        });
      }

    } else if (action === 'reject') {
      listing.status = 'rejected';

      // Update Audit Log
      if (!listing.auditLog) listing.auditLog = [];
      listing.auditLog.push({
        action: 'rejected',
        reason: message || 'Manual Rejection by Admin',
        adminId: req.user._id,
        timestamp: new Date()
      });

      // Send Email
      if (listing.provider?.email) {
        const emailSubject = `Listing Rejected: ${listing.title}`;
        const emailBody = `Your listing "${listing.title}" has been rejected.${message ? `\n\nReason:\n${message}` : ''}`;
        await sendEmail(listing.provider.email, emailSubject, emailBody);
      }

      // Create System Ticket
      if (message) {
        await Ticket.create({
          provider: listing.provider._id,
          subject: `Listing Rejected: ${listing.title}`,
          message: message,
          category: 'legal',
          status: 'resolved', // or closed
          adminResponse: 'Rejected'
        });
      }
    }

    await listing.save();
    res.json(listing);
  } catch (error) {
    console.error("Moderation Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Direct Message Information Request
// @route   POST /api/admin/providers/contact
// @access  Private/Admin
export const contactProvider = async (req, res) => {
  const { providerId, listingId, subject, message } = req.body;

  try {
    const Ticket = (await import('../models/Ticket.js')).default;
    const provider = await User.findById(providerId);

    if (!provider) return res.status(404).json({ message: "Provider not found" });

    // 1. Create Ticket (Visible in Inbox)
    const newTicket = await Ticket.create({
      provider: providerId,
      subject: subject || 'Admin Notice',
      message: message,
      category: 'general',
      status: 'open', // Keep open for reply
      priority: 'high',
      source: 'admin'
    });

    // 2. Send Email Notification
    if (provider.email) {
      await sendEmail(
        provider.email,
        `New Message from Admin: ${subject}`,
        `You have received a new message regarding your active listings.\n\nMessage:\n"${message}"\n\nPlease log in to your portal to reply.`
      );
    }

    res.json({ success: true, ticket: newTicket });

  } catch (error) {
    console.error("Contact Provider Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    // Auto-migrate legacy 'pending_review' listings to 'active' since approval queue is removed
    await Listing.updateMany({ status: 'pending_review' }, { status: 'active' });

    // --- Helper for Growth Calculation (Month over Month) ---
    const calculateStockGrowth = async (Model, query = {}) => {
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      const currentCount = await Model.countDocuments(query);
      const prevCount = await Model.countDocuments({
        ...query,
        createdAt: { $lt: monthAgo }
      });

      if (prevCount === 0) return currentCount > 0 ? 100 : 0;
      return Math.round(((currentCount - prevCount) / prevCount) * 100);
    };

    const calculateRevenueGrowth = async () => {
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      // Total Revenue (All Time)
      const totalRevResult = await Booking.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]);
      const totalRev = (totalRevResult.length > 0 ? totalRevResult[0].total : 0) * 0.05;

      // Revenue up to last month
      const prevRevResult = await Booking.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $lt: monthAgo } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]);
      const prevRev = (prevRevResult.length > 0 ? prevRevResult[0].total : 0) * 0.05;

      if (prevRev === 0) return totalRev > 0 ? 100 : 0;
      return Math.round(((totalRev - prevRev) / prevRev) * 100);
    };

    // 1. Counts & Growth
    // Import Report model dynamically to avoid circular dependency issues if any, or just standard import
    const Report = (await import('../models/Report.js')).default;

    const totalUsers = await User.countDocuments();
    const usersGrowth = await calculateStockGrowth(User);

    const activeListings = await Listing.countDocuments({ status: { $in: ['active', 'published', 'Published'] } });
    const listingsGrowth = await calculateStockGrowth(Listing, { status: { $in: ['active', 'published', 'Published'] } });

    // Pending Reviews = (Listings Hidden by Audit) + (Pending User Reports)
    const hiddenListingsCount = await Listing.countDocuments({ status: 'hidden_by_audit' });
    const pendingReportsCount = await Report.countDocuments({ status: 'Pending' });

    const pendingReviews = hiddenListingsCount + pendingReportsCount;

    // Calculate growth for combined pending items (roughly)
    const hiddenListingsGrowth = await calculateStockGrowth(Listing, { status: 'hidden_by_audit' });
    // We can just use the listings growth for now or calculate properly. 
    // For simplicity and to avoid complex combined previous date queries, let's use the hidden listings growth as the trend indicator or 0.
    const pendingGrowth = hiddenListingsGrowth;

    // 2. Revenue
    const revenueResult = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalVolume = revenueResult.length > 0 ? revenueResult[0].total : 0;
    const revenue = totalVolume * 0.05; // 5% Platform Commission
    const revenueGrowth = await calculateRevenueGrowth();


    console.log("--- ADMIN STATS DEBUG ---");
    console.log(`Users: ${totalUsers} (${usersGrowth}%)`);
    console.log(`Listings: ${activeListings} (${listingsGrowth}%)`);
    console.log(`Revenue: ${revenue} (${revenueGrowth}%)`);
    console.log("-------------------------");

    // User Growth Chart Data (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format for Recharts
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toISOString().slice(0, 7)); // YYYY-MM
    }

    const chartData = months.map(month => {
      const found = userGrowth.find(item => item._id === month);
      const dateObj = new Date(month + "-01");
      return {
        name: dateObj.toLocaleString('default', { month: 'short' }),
        active: found ? found.count : 0, // Using 'active' key to match existing frontend code
        new: found ? found.count : 0
      };
    });


    res.json({
      totalUsers,
      usersGrowth,
      activeListings,
      listingsGrowth,
      revenue,
      revenueGrowth,
      pendingReviews,
      pendingGrowth,
      chartData
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Suspend/Unsuspend User
// @route   PUT /api/admin/users/:id/suspend
// @access  Private/Admin
export const suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = user.status === 'suspended' ? 'active' : 'suspended';
    await user.save();

    res.json({ message: `User ${user.status} successfully`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete User
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get User by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update User
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Warn User
// @route   POST /api/admin/users/:id/warn
// @access  Private/Admin
export const warnUser = async (req, res) => {
  const { reason } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.warningCount = (user.warningCount || 0) + 1;
    user.warningHistory.push({
      reason,
      adminId: req.user._id, // Assuming auth middleware adds user to req
      date: new Date()
    });

    await user.save();

    // Send warning email
    await sendEmail(
      user.email,
      'Warning: BodimGo Community Guidelines Violation',
      `Dear ${user.name},\n\nYou have received a warning for the following reason:\n\n"${reason}"\n\nPlease review our community guidelines. Further violations may result in account suspension.\n\nRegards,\nBodimGo Team`
    );
    console.log(`Warning email sent to ${user.email}`);

    res.json({
      message: 'User warned successfully',
      warningCount: user.warningCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

