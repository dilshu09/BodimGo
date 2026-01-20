import mongoose from 'mongoose';

const SeekerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  preferences: {
    minPrice: { type: Number },
    maxPrice: { type: Number },
    preferredCities: [{ type: String }],
    lookingFor: { type: String, enum: ['room', 'annex', 'house'] }
  },
  savedListings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
  verifiedTenant: { type: Boolean, default: false }
}, {
  timestamps: true
});

export default mongoose.model('SeekerProfile', SeekerProfileSchema);
