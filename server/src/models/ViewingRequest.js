import mongoose from 'mongoose';

const viewingRequestSchema = new mongoose.Schema({
    seeker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    date: {
        type: String, // Or Date, but string 'YYYY-MM-DD' is often easier for simple matching unless filtering by range
        required: true
    },
    time: {
        type: String,
        required: true
    },
    note: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed'],
        default: 'pending'
    },
    providerReply: {
        type: String
    }
}, {
    timestamps: true
});

const ViewingRequest = mongoose.model('ViewingRequest', viewingRequestSchema);

export default ViewingRequest;
