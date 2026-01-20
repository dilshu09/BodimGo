import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { 
    type: String, 
    enum: [
      'booking_request', 'booking_accepted', 'payment_success', 'rent_due', 'new_message', 
      'review_received', 'security_alert', 'system_update'
    ], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  
  data: { type: mongoose.Schema.Types.Mixed }, // e.g., { bookingId: '...' }
  
  isRead: { type: Boolean, default: false },
  readAt: Date
}, {
  timestamps: true
});

export default mongoose.model('Notification', NotificationSchema);
