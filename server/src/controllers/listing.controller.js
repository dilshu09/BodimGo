import Listing from '../models/Listing.js';
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
export const getListings = async (req, res) => {
  try {
    const { city, minRent, maxRent, type } = req.query;

    let query = { status: 'Published' }; // Default to Published only

    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }
    if (minRent || maxRent) {
      query['rooms.price'] = {}; // Search rooms price? Or Listing price range? Schema has 'rent' in rooms.
      // Schema structure: rooms array. Querying array fields is tricky for range.
      // Often better to flatten price to listing level or use aggregate.
      // For now, keep simple:
    }
    if (type) {
      query.type = type;
    }

    const listings = await Listing.find(query)
      .populate('provider', 'name isVerified')
      .sort({ createdAt: -1 });

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
      .populate('provider', 'name isVerified email phone')
      .populate('agreementTemplate');
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
