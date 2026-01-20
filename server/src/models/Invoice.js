import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  invoiceNumber: { type: String, required: true, unique: true },
  month: { type: String, required: true }, // Format YYYY-MM
  dueDate: { type: Date, required: true },
  
  items: [{
    description: { type: String, required: true },
    amount: { type: Number, required: true }
  }],
  
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  
  status: { type: String, enum: ['draft', 'due', 'paid', 'overdue', 'void'], default: 'draft', index: true },
  generatedPdfUrl: String
}, {
  timestamps: true
});

export default mongoose.model('Invoice', InvoiceSchema);
