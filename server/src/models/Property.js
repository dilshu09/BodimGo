import mongoose from 'mongoose';

const PropertySchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['house', 'annex', 'hostel', 'apartment'], required: true },
  
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true, index: true },
    district: { type: String, required: true },
    postalCode: String,
    country: { type: String, default: 'Sri Lanka' }
  },
  geo: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true, index: '2dsphere' } // Longitude, Latitude
  },
  privacyMode: { type: String, enum: ['exact', 'approximate'], default: 'approximate' },

  images: [{ type: String }],
  videoUrl: String,

  facilities: [{ type: String }],
  rules: [{ type: String }],
  
  verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' }
}, {
  timestamps: true
});

export default mongoose.model('Property', PropertySchema);
