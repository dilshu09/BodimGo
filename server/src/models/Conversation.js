import mongoose from 'mongoose';

// Conversation
const ConversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  contextListing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  lastMessageContent: String
}, {
  timestamps: true
});

export const Conversation = mongoose.model('Conversation', ConversationSchema);

// Message
const MessageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  attachments: [{
    type: { type: String, enum: ['image', 'document'] },
    url: String
  }],
  
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  isSafe: { type: Boolean, default: true },
  flaggedReasons: [{ type: String }]
}, {
  timestamps: true
});

export const Message = mongoose.model('Message', MessageSchema);
