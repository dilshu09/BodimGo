import mongoose from 'mongoose';

const agreementSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  content: {
    type: String, // Or JSON for structured content
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending Signature', 'Signed', 'Active', 'Terminated', 'Expired'],
    default: 'Draft'
  },
  signedUrl: {
    type: String // URL to PDF signature proof
  },
  signedDate: {
    type: Date
  },
  lockPeriodMonths: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.model('Agreement', agreementSchema);
