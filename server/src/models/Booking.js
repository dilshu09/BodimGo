import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  seeker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Denormalized for query speed
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },

  status: {
    type: String,
    enum: ['pending', 'pending_payment', 'accepted', 'rejected', 'deposit_pending', 'confirmed', 'cancelled', 'moved_in'],
    default: 'pending', // Changed from pending_payment
    index: true
  },

  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  moveInDate: { type: Date }, // Optional alias

  durationMonths: { type: Number },

  // New fields for Request Flow
  applicationData: {
    occupation: { type: String, enum: ['Student', 'Working Professional', 'Other'] },
    note: { type: String },
    phone: { type: String },
    address: { type: String }
  },
  agreementAccepted: { type: Boolean, default: false },

  agreedMonthRent: { type: Number, required: true },
  agreedDeposit: { type: Number, required: true },
  totalAmount: { type: Number, required: true },

  paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid', 'refunded'], default: 'unpaid' },
  stripePaymentId: String

}, {
  timestamps: true
});

export default mongoose.model('Booking', BookingSchema);
