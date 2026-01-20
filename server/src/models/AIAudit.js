import mongoose from 'mongoose';

const AIAuditSchema = new mongoose.Schema({
  agentName: { type: String, required: true },
  actionType: { type: String, required: true },
  
  entityType: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  
  inputTextHash: String,
  outputResult: { type: mongoose.Schema.Types.Mixed },
  
  riskScore: { type: Number, default: 0 },
  decision: { type: String, enum: ['allow', 'block', 'flag', 'warn', 'none'], default: 'none' }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export default mongoose.model('AIAudit', AIAuditSchema);
