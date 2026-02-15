import Listing from '../models/Listing.js';
import Tenant from '../models/tenant.model.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { runAgent } from '../ai/orchestrator.js';
import mongoose from 'mongoose';

// @desc    Create a new listing (Multi-step Wizard)
// @route   POST /api/listings
// @access  Private (Provider)
export const createListing = async (req, res) => {
  try {
    const data = req.body;

    // --- 0. AI BLOCKING VALIDATION ---
    console.log("Starting Sync AI Validation...");

    // A. Text & PII Check
    const textContext = `${data.title} ${data.description}`;
    const abusiveCheck = await runAgent('AbusiveWordsCheckAgent', {
      text: textContext,
      context: { userId: req.user.id }
    }, { type: 'validation', id: new mongoose.Types.ObjectId() });

    if (abusiveCheck.action === 'block' || abusiveCheck.pii_detected) {
      return res.status(400).json({
        success: false,
        message: 'Validation Failed: Content Safety',
        error: abusiveCheck.reason || "Description contains inappropriate language or prohibited phone numbers (PII)."
      });
    }

    // B. Location Verification
    if (data.location) {
      const locationCheck = await runAgent('AddressVerificationAgent', {
        ...data.location
      }, { type: 'validation', id: new mongoose.Types.ObjectId() });

      if (!locationCheck.isValid) {
        const errorMsg = Object.values(locationCheck.errors || {}).join(', ') || "Location details do not match coordinates.";
        return res.status(400).json({
          success: false,
          message: 'Validation Failed: Location Mismatch',
          error: errorMsg
        });
      }
    }

    // C. Image Moderation (Main Images)
    if (data.images && data.images.length > 0) {
      const base64Images = data.images.filter(img => img.startsWith('data:image'));
      for (const img of base64Images) {
        const base64 = img.split(',')[1];
        const imageCheck = await runAgent('ImageModerationAgent', {
          imageBase64: base64,
          imageId: 'upload'
        }, { type: 'validation', id: new mongoose.Types.ObjectId() });

        if (!imageCheck.isAllowed) {
          return res.status(400).json({
            success: false,
            message: 'Validation Failed: Image Rejected',
            error: imageCheck.reason || "Image must be a clear property photo (No animals, people, or text)."
          });
        }
      }
    }
    console.log("AI Validation Passed. Proceeding...");
    // --------------------------------

    console.log("Creating Listing. Processing Images...");

    // --- Cloudinary Integration ---
    // 1. Upload Main Images
    if (data.images && data.images.length > 0) {
      console.log(`Uploading ${data.images.length} main images...`);
      const cloudUrls = await Promise.all(
        data.images.map(url => uploadToCloudinary(url))
      );
      data.images = cloudUrls;
    }

    // 2. Upload Room Images
    if (data.rooms && data.rooms.length > 0) {
      console.log(`Processing ${data.rooms.length} rooms...`);
      await Promise.all(data.rooms.map(async (room, index) => {
        if (room.images && room.images.length > 0) {
          console.log(`Uploading ${room.images.length} images for room ${index}...`);
          const roomCloudUrls = await Promise.all(
            room.images.map(url => uploadToCloudinary(url))
          );
          data.rooms[index].images = roomCloudUrls;
        }
      }));
    }

    console.log("Images processed. Saving listing...");

    // Determine status
    // Default to 'active' (Live Immediately) unless explicitly 'draft'
    let status = 'active';
    if (data.status === 'draft') status = 'draft';

    // AI verification is now blocking, so we don't set 'hidden_by_audit' here.
    // If AI verification flags exist, or explicitly set to hidden by audit (Logic Removed)

    const newListing = new Listing({
      ...data,
      provider: req.user.id, // Set provider from auth
      status
    });

    const savedListing = await newListing.save();

    res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      listing: savedListing
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Listing validation failed',
        error: messages.join(', ')
      });
    }
    console.error("Create Listing Error:", error.message);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get all listings (Public Search)
// @route   GET /api/listings
// @access  Public
// @desc    Get all listings (Public Search)
// @route   GET /api/listings
// @access  Public
export const getListings = async (req, res) => {
  try {
    const { search, gender, minPrice, maxPrice, type, city } = req.query;

    let matchStage = { status: { $in: ['active', 'published', 'Published'] } };

    // 1. Text Search (Location OR Title)
    // If 'search' is provided, it matches EITHER city OR title
    if (search) {
      matchStage['$or'] = [
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'title': { $regex: search, $options: 'i' } }
      ];
    } else if (city) {
      // Fallback for legacy city-only search if needed
      matchStage['location.city'] = { $regex: city, $options: 'i' };
    }

    // 2. Type Filter
    if (type) {
      matchStage.type = type;
    }

    // 3. Gender Filter
    if (gender) {
      // Matching strict enum values: 'Girls only', 'Boys only', 'Mixed'
      matchStage.genderPolicy = gender;
    }

    // 4. Price Filter (Advanced)
    // Filtering by room price. We want listings where AT LEAST ONE room fits the budget.
    if (minPrice || maxPrice) {
      const min = parseInt(minPrice) || 0;
      const max = parseInt(maxPrice) || 1000000;
      matchStage['rooms.price'] = { $gte: min, $lte: max };
    }

    const listings = await Listing.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          // Check if ANY room has status 'Available'
          hasAvailability: {
            $cond: {
              if: { $in: ['Available', '$rooms.status'] },
              then: 1,
              else: 0
            }
          }
        }
      },
      {
        $sort: {
          hasAvailability: -1, // Available (1) first, then Occupied (0)
          createdAt: -1        // Then newest first
        }
      },
      // Lookup Provider (Populate replacement)
      {
        $lookup: {
          from: 'users',
          localField: 'provider',
          foreignField: '_id',
          as: 'provider',
          pipeline: [{ $project: { name: 1, isVerified: 1 } }]
        }
      },
      { $unwind: '$provider' }
    ]);

    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single listing
// @route   GET /api/listings/:id
// @access  Public
export const getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('provider', 'name email profileImage')
      .populate({
        path: 'agreementTemplate',
        select: 'name content rules'
      });
    if (listing) {
      // Increment views
      listing.viewCount = (listing.viewCount || 0) + 1;
      await listing.save({ validateBeforeSave: false });
      res.json(listing);
    } else {
      res.status(404).json({ message: 'Listing not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update listing
// @route   PUT /api/listings/:id
// @access  Private (Provider)
// @desc    Update listing
// @route   PUT /api/listings/:id
// @access  Private (Provider)
export const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Check ownership
    if (listing.provider.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    let data = req.body;

    // --- Handle Image Uploads for Rooms ---
    if (data.rooms && Array.isArray(data.rooms)) {
      console.log("Processing Room Updates & Images...");
      await Promise.all(data.rooms.map(async (room, index) => {
        if (room.images && room.images.length > 0) {
          // Filter for base64 images that need uploading
          const processedImages = await Promise.all(room.images.map(async (img) => {
            if (img.startsWith('data:image')) {
              return await uploadToCloudinary(img);
            }
            return img; // Already a URL
          }));
          data.rooms[index].images = processedImages;
        }
      }));
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      { ...data, status: data.status || listing.status }, // Allow status update
      { new: true, runValidators: true }
    ).populate('agreementTemplate');

    res.json({
      success: true,
      data: updatedListing
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get provider's own listings
// @route   GET /api/listings/my
// @access  Private (Provider)
export const getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ provider: req.user.id })
      .select('title address location status images stats rooms type pricingDefaults')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: listings.length,
      data: listings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
// @desc    Get all rooms across all listings for a provider
// @route   GET /api/listings/provider/rooms
// @access  Private (Provider)
export const getAllProviderRooms = async (req, res) => {
  try {
    const listings = await Listing.find({ provider: req.user.id })
      .select('title rooms status location images')
      .lean();

    // Get all tenants for this provider (active only)
    // Note: Assuming 'tenant' model (imported as Tenant) has 'roomId' and 'status'
    // If Tenant.js uses room: ObjectId ref Room, but Room collection is unused, 
    // we assume 'roomId' in Tenant stores the Room Subdocument ID.
    const activeTenants = await Tenant.find({
      providerId: req.user.id,
      status: { $in: ['active', 'Pending', 'Active'] }
    }).select('roomId name status rentAmount');

    const tenantMap = {};
    activeTenants.forEach(t => {
      if (t.roomId) tenantMap[t.roomId.toString()] = t;
    });

    let allRooms = [];
    listings.forEach(listing => {
      if (listing.rooms && listing.rooms.length > 0) {
        const roomsWithContext = listing.rooms.map(room => {
          // Try to find tenant
          const tenant = tenantMap[room._id.toString()];

          return {
            ...room,
            listingId: listing._id,
            listingTitle: listing.title,
            listingStatus: listing.status,
            location: listing.location,
            // Determine display image
            image: (room.images && room.images.length > 0) ? room.images[0] : (listing.images && listing.images.length > 0 ? listing.images[0] : null),
            // Tenant Info
            tenantName: tenant ? tenant.name : (room.status === 'Occupied' ? 'Unknown' : 'Empty'),
            tenantStatus: tenant ? tenant.status : 'N/A'
          };
        });
        allRooms = [...allRooms, ...roomsWithContext];
      }
    });

    res.json({
      success: true,
      count: allRooms.length,
      data: allRooms
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Update room status (Provider)
// @route   PUT /api/listings/provider/rooms/:roomId/status
// @access  Private (Provider)
export const updateRoomStatus = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { status } = req.body; // e.g., 'Available', 'Maintenance'

    // Validate status
    const validStatuses = ['Available', 'Reserved', 'Occupied', 'Maintenance'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid room status' });
    }

    // Find listing containing the room and provider
    const listing = await Listing.findOne({
      provider: req.user.id,
      "rooms._id": roomId
    });

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Room not found or unauthorized' });
    }

    // Update the room status
    const roomIndex = listing.rooms.findIndex(r => r._id.toString() === roomId);
    if (roomIndex === -1) {
      return res.status(404).json({ success: false, message: 'Room not found in listing' });
    }

    listing.rooms[roomIndex].status = status;
    await listing.save();

    res.json({
      success: true,
      message: 'Room status updated',
      data: listing.rooms[roomIndex]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Add a room to a listing
// @route   POST /api/listings/provider/rooms
// @access  Private (Provider)
export const addRoom = async (req, res) => {
  try {
    const { listingId, roomData } = req.body;

    // Validate listing ownership
    const listing = await Listing.findOne({ _id: listingId, provider: req.user.id });
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found or unauthorized' });
    }

    // Process images if any
    if (roomData.images && roomData.images.length > 0) {
      const processedImages = await Promise.all(roomData.images.map(async (img) => {
        if (img.startsWith('data:image')) {
          return await uploadToCloudinary(img);
        }
        return img;
      }));
      roomData.images = processedImages;
    }

    // Add room
    listing.rooms.push(roomData);
    await listing.save();

    const newRoom = listing.rooms[listing.rooms.length - 1];

    res.json({
      success: true,
      message: 'Room added successfully',
      data: newRoom
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Update specific room details
// @route   PUT /api/listings/provider/rooms/:roomId
// @access  Private (Provider)
export const updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const updateData = req.body;

    // Find listing containing the room
    const listing = await Listing.findOne({
      provider: req.user.id,
      "rooms._id": roomId
    });

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Update room fields
    const roomIndex = listing.rooms.findIndex(r => r._id.toString() === roomId);
    if (roomIndex === -1) return res.status(404).json({ message: 'Room not found' });

    // Handle Image Uploads for the specific room
    if (updateData.images && updateData.images.length > 0) {
      const processedImages = await Promise.all(updateData.images.map(async (img) => {
        if (img.startsWith('data:image')) {
          return await uploadToCloudinary(img);
        }
        return img;
      }));
      updateData.images = processedImages;
    }

    // Merge updates
    const currentRoom = listing.rooms[roomIndex];
    listing.rooms[roomIndex] = { ...currentRoom.toObject(), ...updateData };

    await listing.save();

    res.json({
      success: true,
      message: 'Room updated successfully',
      data: listing.rooms[roomIndex]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a room
// @route   DELETE /api/listings/provider/rooms/:roomId
// @access  Private (Provider)
export const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const listing = await Listing.findOne({
      provider: req.user.id,
      "rooms._id": roomId
    });

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Check if room has active tenant before deleting?
    // For now, simpler implementation: just remove.
    // In production, you'd check if room.status === 'Occupied' or check Tenants collection.

    listing.rooms = listing.rooms.filter(r => r._id.toString() !== roomId);
    await listing.save();

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get Dashboard Stats
// @route   GET /api/listings/dashboard/stats
// @access  Private (Provider)
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const Booking = (await import('../models/Booking.js')).default;

    // 1. Fetch all listings for this provider
    const listings = await Listing.find({ provider: userId }).select('rooms title _id');

    // 2. Calculate Occupancy & Vacant Beds
    let totalRooms = 0;
    let occupiedRooms = 0;

    listings.forEach(listing => {
      if (listing.rooms && listing.rooms.length > 0) {
        totalRooms += listing.rooms.length;
        occupiedRooms += listing.rooms.filter(r => r.status === 'Occupied').length;
      }
    });

    const vacantBeds = totalRooms - occupiedRooms;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // 3. Expected Income (Active Tenants)
    const activeTenants = await Tenant.find({
      providerId: userId,
      status: { $in: ['active', 'Active'] }
    }).select('rentAmount');

    const expectedIncome = activeTenants.reduce((sum, t) => sum + (t.rentAmount || 0), 0);

    // 4. Pending Actions (Pending Bookings)
    // We can also include 'Pending' tenants if that's a thing, or maintenance requests later.
    const pendingBookings = await Booking.find({
      provider: userId,
      status: 'pending'
    }).populate('seeker', 'name').populate('listing', 'title').limit(5);

    const pendingCount = pendingBookings.length;

    // 5. Overdue Payments (Mock/Placeholder for now as we don't have due dates strictly tracked yet in a simple way)
    // In real app, check PaymentDue collection or Bookings with nextPaymentDate < today
    const overdueCount = 0;

    // 6. Upcoming Payments (Next 7 days? - Mock for now)
    const upcomingPayments = [];

    res.json({
      success: true,
      stats: {
        occupancyRate,
        vacantBeds,
        expectedIncome,
        pendingCount,
        overdueCount
      },
      pendingApprovals: pendingBookings.map(b => ({
        id: b._id,
        title: b.seeker?.name || 'Unknown Guest',
        subtitle: b.listing?.title || 'Unknown Listing',
        action: 'Review',
        date: b.createdAt
      })),
      upcomingPayments: upcomingPayments,
      overduePayments: []
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
// @desc    Get Pending Approvals (Aggregated)
// @route   GET /api/listings/pending-approvals
// @access  Private (Provider)
export const getPendingApprovals = async (req, res) => {
  try {
    const userId = req.user.id;
    const Tenant = (await import('../models/tenant.model.js')).default;


    // 1. Pending Tenants (Verification)
    const pendingTenants = await Tenant.find({
      providerId: userId,
      status: 'Pending'
    }).select('name email joinedDate');



    // 3. Draft/Pending Listings
    const pendingListings = await Listing.find({
      provider: userId,
      status: { $in: ['draft', 'pending_review'] }
    }).select('title status updatedAt');

    // 4. Pending Booking Requests (New)
    const Booking = (await import('../models/Booking.js')).default;
    const pendingBookings = await Booking.find({
      provider: userId,
      status: 'pending'
    }).populate('seeker', 'name').select('createdAt');

    // Format tasks standard structure
    const tasks = [
      ...pendingBookings.map(b => ({
        id: b._id,
        title: `Booking Request: ${b.seeker?.name || 'Guest'}`,
        description: 'New booking request requires your approval',
        status: 'urgent',
        type: 'booking',
        date: b.createdAt ? b.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      })),
      ...pendingTenants.map(t => ({
        id: t._id,
        title: `Verify Tenant: ${t.name}`,
        description: `Review documents for ${t.name} (${t.email})`,
        status: 'urgent',
        type: 'verification',
        date: t.joinedDate ? t.joinedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      })),
      ...pendingListings.map(l => ({
        id: l._id,
        title: `Complete Listing: ${l.title}`,
        description: `Listing is currently ${l.status.replace('_', ' ')}`,
        status: 'pending',
        type: 'listing',
        date: l.updatedAt ? l.updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }))
    ];

    res.json({ success: true, count: tasks.length, data: tasks });

  } catch (error) {
    console.error("Pending Approvals Error:", error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a listing
// @route   DELETE /api/listings/:id
// @access  Private (Provider/Admin)
export const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Check ownership (unless admin)
    if (listing.provider.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    await listing.deleteOne();

    res.json({ success: true, message: 'Listing deleted successfully' });
  } catch (error) {
    console.error("Delete Listing Error:", error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
