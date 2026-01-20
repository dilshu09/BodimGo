import mongoose from 'mongoose';

const TenantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  
  bookingOrigin: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  
  status: { type: String, enum: ['active', 'moving_out', 'past'], default: 'active', index: true },
  
  leaseStartDate: { type: Date, required: true },
  leaseEndDate: { type: Date },
  
  rentAmount: { type: Number, required: true },
  rentDueDateDay: { type: Number, default: 5 }, // Default to 5th
  
  depositHeld: { type: Number, default: 0 },
  outstandingBalance: { type: Number, default: 0 },
  
  documents: [{
    name: String,
    url: String,
    type: { type: String, enum: ['agreement', 'nic_copy', 'other'] }
  }]
}, {
  timestamps: true
});

export default mongoose.model('Tenant', TenantSchema);
