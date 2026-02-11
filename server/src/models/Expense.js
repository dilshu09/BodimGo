import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        enum: ['Utility', 'Maintenance', 'Repair', 'Cleaning', 'Internet', 'Other'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    receiptUrl: {
        type: String
    }
}, {
    timestamps: true
});

export default mongoose.model('Expense', ExpenseSchema);
