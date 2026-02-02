import Listing from '../models/Listing.js';
import Tenant from '../models/tenant.model.js'; // Use correct file name from file list
import { uploadToCloudinary } from '../utils/cloudinary.js';

// @desc    Create a new listing (Multi-step Wizard)
// @route   POST /api/listings
// @access  Private (Provider)
export const createListing = async (req, res) => {
  try {
    const data = req.body; // Use 'data' variable consistently

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

    // Determine status (handle AI flags if passed in body, though usually backend re-evaluates)
    // For now, respect the status derived from frontend or default to Published
    let status = 'Published';
    if (data.status === 'Draft') status = 'Draft';
    // If AI verification happened on frontend, we might trust it or re-run here.
    // Assuming Frontend handled verification and we trust the 'status' passed (if sanitized) 
    // OR we assume 'Published' unless flags exist.
    // Based on User's JSON, status was 'Hidden_By_Audit' if flags existed.
    if (data.status) status = data.status;

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

    let matchStage = { status: 'Published' };

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
