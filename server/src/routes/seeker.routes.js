import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import SeekerProfile from "../models/SeekerProfile.js";

const router = express.Router();

// ADD to wishlist
router.post("/wishlist", protect, async (req, res) => {
  const { listingId } = req.body;

  if (!listingId) {
    return res.status(400).json({ message: "Listing ID required" });
  }

  let profile = await SeekerProfile.findOne({ user: req.user._id });

  if (!profile) {
    // Create profile if it doesn't exist (lazy creation)
    profile = new SeekerProfile({ user: req.user._id, savedListings: [] });
  }

  if (!profile.savedListings.includes(listingId)) {
    profile.savedListings.push(listingId);
    await profile.save();
  }

  res.json({
    success: true,
    savedListings: profile.savedListings,
  });
});

// GET wishlist
router.get("/wishlist", protect, async (req, res) => {
  try {
    const profile = await SeekerProfile.findOne({ user: req.user._id }).populate({
      path: 'savedListings',
      populate: { path: 'provider', select: 'name email' } // optional: populate provider
    });

    if (!profile) {
      return res.json({ success: true, savedListings: [] });
    }

    res.json({
      success: true,
      savedListings: profile.savedListings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// REMOVE from wishlist
router.delete("/wishlist/:id", protect, async (req, res) => {
  try {
    const profile = await SeekerProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    profile.savedListings = profile.savedListings.filter(
      (id) => id.toString() !== req.params.id
    );
    await profile.save();

    res.json({ success: true, savedListings: profile.savedListings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
