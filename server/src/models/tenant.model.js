import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  roomId: {
    type: String,
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  nic: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    trim: true,
    default: '' // Can be manually added or fetched from profile
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Active', 'Moved Out', 'Evicted'],
    default: 'Pending'
  },
  agreementStatus: {
    type: String,
    enum: ['Not Generated', 'Sent', 'Signed', 'Active', 'Expired'],
    default: 'Not Generated'
  },
  // Finance
  rentAmount: {
    type: Number,
    required: true
  },
  depositAmount: {
    type: Number,
    default: 0
  },
  joinedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Tenant', tenantSchema);
