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

  const profile = await SeekerProfile.findOne({ user: req.user._id });

  if (!profile) {
    return res.status(404).json({ message: "Seeker profile not found" });
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

export default router;
