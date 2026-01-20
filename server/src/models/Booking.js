import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  seeker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Denormalized for query speed
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'deposit_pending', 'confirmed', 'cancelled', 'moved_in'], 
    default: 'pending',
    index: true
  },
  
  moveInDate: { type: Date, required: true },
  durationMonths: { type: Number },
  
  agreedMonthRent: { type: Number, required: true },
  agreedDeposit: { type: Number, required: true },
  
  paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid', 'refunded'], default: 'unpaid' },
  stripePaymentId: String

}, {
  timestamps: true
});

export default mongoose.model('Booking', BookingSchema);
