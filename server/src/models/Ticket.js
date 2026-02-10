import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema({
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    subject: { type: String, required: true },
    message: { type: String, required: true },

    category: {
        type: String,
        enum: ['general', 'billing', 'technical', 'legal'],
        default: 'general'
    },

    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },

    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open'
    },

    adminResponse: { type: String },
    respondedAt: { type: Date },

    source: {
        type: String,
        enum: ['provider', 'admin'],
        default: 'provider'
    }

}, {
    timestamps: true
});

export default mongoose.model('Ticket', TicketSchema);
