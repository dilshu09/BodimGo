import User from '../models/User.js';
import ProviderProfile from '../models/ProviderProfile.js';
import Listing from '../models/Listing.js';

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
    .populate('provider', 'name email')
    .sort({ createdAt: -1 });
    
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve or Reject Listing
// @route   PUT /api/admin/listings/:id/action
// @access  Private/Admin
export const moderateListing = async (req, res) => {
  const { action } = req.body; // 'approve' or 'reject'
  
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (action === 'approve') {
      listing.status = 'active';
      listing.aiSafetyFlags = []; // Clear flags on manual approval
    } else if (action === 'reject') {
      listing.status = 'rejected';
    }

    await listing.save();
    res.json(listing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
