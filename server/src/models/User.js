import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['seeker', 'provider', 'admin'],
    default: 'seeker',
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    default: 'active',
  },
  profileImage: {
    type: String,
    default: '',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  refreshToken: {
    type: String,
  },
  adminPermissions: [{
    type: String
  }],
  lastLogin: {
    type: Date,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  warningCount: {
    type: Number,
    default: 0
  },
  warningHistory: [{
    reason: String,
    date: {
      type: Date,
      default: Date.now
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true,
});

export default mongoose.model('User', UserSchema);
