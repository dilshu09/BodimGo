import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['single', 'double', 'shared', 'dorm'], required: true },
  capacity: { type: Number, required: true },
  
  totalBeds: { type: Number, required: true },
  availableBeds: { type: Number, required: true }, // Logic: total - active tenants

  rentAmount: { type: Number, required: true },
  depositAmount: { type: Number, required: true },
  billingCycle: { type: String, enum: ['monthly', 'weekly'], default: 'monthly' },
  
  facilities: [{ type: String }],
  images: [{ type: String }], // Room specific photos

  status: { type: String, enum: ['active', 'maintenance', 'full'], default: 'active' }
}, {
  timestamps: true
});

export default mongoose.model('Room', RoomSchema);
