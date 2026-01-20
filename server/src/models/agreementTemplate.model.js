import mongoose from 'mongoose';

const AgreementTemplateSchema = new mongoose.Schema({
    provider: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    lockPeriod: { 
        type: Number, // Month
        required: true 
    },
    noticePeriod: { 
        type: Number, // Months
        required: true 
    },
    content: { 
        type: String, 
        required: true // Single description/terms
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default mongoose.model('AgreementTemplate', AgreementTemplateSchema);
