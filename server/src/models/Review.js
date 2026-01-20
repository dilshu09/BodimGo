import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetListing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  
  subRatings: {
    cleanliness: Number,
    accuracy: Number,
    communication: Number,
    location: Number
  },
  
  aiModerationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, {
  timestamps: true
});

// Ensure one review per author per target
ReviewSchema.index({ author: 1, targetListing: 1 }, { unique: true, partialFilterExpression: { targetListing: { $exists: true } } });

export default mongoose.model('Review', ReviewSchema);
