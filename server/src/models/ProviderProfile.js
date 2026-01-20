import mongoose from 'mongoose';

const ProviderProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  businessName: { type: String },
  bio: { type: String },
  
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected', 'not_submitted'], 
    default: 'not_submitted' 
  },
  kycDocuments: [{
    type: { type: String, enum: ['nic', 'passport', 'business_reg'] },
    url: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  identityVerifiedAt: { type: Date },

  stripeAccountId: { type: String },
  stripeOnboardingComplete: { type: Boolean, default: false },
  payoutSettings: {
    bankName: { type: String },
    accountNumber: { type: String }
  },

  reputationScore: { type: Number, default: 0 },
  responseRate: { type: Number, default: 0 },
  averageResponseTime: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 }
}, {
  timestamps: true
});

export default mongoose.model('ProviderProfile', ProviderProfileSchema);
