import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  payer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  payee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  amount: { type: Number, required: true },
  method: { type: String, enum: ['stripe', 'cash', 'bank_transfer'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending', index: true },
  
  stripePaymentId: String,
  proofImageUrl: String,
  
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiptPdfUrl: String
}, {
  timestamps: true
});

export default mongoose.model('Payment', PaymentSchema);
