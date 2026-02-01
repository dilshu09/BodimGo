import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    reason: { type: String, required: true },
    description: { type: String, required: true },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Resolved', 'Dismissed'],
        default: 'Pending'
    }
}, {
    timestamps: true
});

export default mongoose.model('Report', ReportSchema);
