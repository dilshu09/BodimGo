import mongoose from 'mongoose';

const ListingSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // --- 1. Property Info ---
  title: { type: String, required: true, minlength: 10, index: true },
  type: {
    type: String,
    required: true,
    enum: ['Annex', 'Single Room', 'House', 'Hostel', 'Apartment', 'Shared House']
  },
  genderPolicy: {
    type: String,
    required: true,
    enum: ['Girls only', 'Boys only', 'Mixed']
  },
  suitableFor: [{ type: String }], // e.g., ['Students', 'Working Professionals']
  description: { type: String, required: true },

  // House Rules (Comprehensive 14-Category Structure)
  rules: {
    // 1. Visitor Rules
    visitors: {
      allowed: { type: Boolean, default: true },
      genderRestriction: { type: String, enum: ['Any', 'Same Gender Only'], default: 'Any' },
      visitingHours: { type: String }, // "Not allowed" or range "9AM-5PM"
      overnightAllowed: { type: Boolean, default: false }
    },
    // 2. Cooking
    cooking: {
      allowed: { type: Boolean, default: false },
      area: { type: String, enum: ['Shared Kitchen', 'In-room', 'None'] },
      timeRestriction: { type: String },
      outsideFoodAllowed: { type: Boolean, default: true },
      mealsProvided: { type: String, enum: ['None', 'Breakfast', 'Lunch', 'Dinner', 'All'] }
    },
    // 3. Curfew
    curfew: {
      enabled: { type: Boolean, default: false },
      time: { type: String },
      lateEntryAllowed: { type: Boolean, default: true },
      gateLockTime: { type: String }
    },
    // 4. Substances
    substances: {
      smokingAllowed: { type: Boolean, default: false },
      alcoholAllowed: { type: Boolean, default: false },
      drugsAllowed: { type: Boolean, default: false } // Always false by default
    },
    // 5. Noise
    noise: {
      quietHours: { type: String }, // "10PM-6AM"
      loudMusicAllowed: { type: Boolean, default: false },
      partiesAllowed: { type: Boolean, default: false }
    },
    // 6. Gender & Occupancy (Redundant with top-level but specific for rules)
    occupancyRules: {
      couplesAllowed: { type: Boolean, default: false },
      guestsPerRoom: { type: Number },
      roomSharingPolicy: { type: String }
    },
    // 7. Cleaning
    cleaning: {
      responsibility: { type: String, enum: ['Tenant', 'Owner', 'Shared'] },
      frequency: { type: String }, // For owner cleaning
      commonAreaRules: { type: String },
      damagePolicy: { type: String }
    },
    // 8. Laundry
    laundry: {
      machineAvailable: { type: Boolean, default: false },
      washingTimes: { type: String },
      ironingAllowed: { type: Boolean, default: true },
      dryingArea: { type: String }
    },
    // 9. Pets
    pets: {
      allowed: { type: Boolean, default: false },
      typeAllowed: { type: String }, // "Small only"
      indoorFeedingAllowed: { type: Boolean, default: false }
    },
    // 10. Security
    security: {
      gateLockPolicy: { type: String },
      cctvAreas: { type: String },
      emergencyContactRequired: { type: Boolean, default: true }
    },
    // 11. Payment Rules
    paymentRules: {
      rentStrictness: { type: String, enum: ['Flexible', 'Strict'] },
      lateFeePolicy: { type: String },
      depositDeductionPolicy: { type: String },
      noticePeriod: { type: String } // "1 Month"
    },
    // 12. Move In/Out
    moveInOut: {
      moveInTime: { type: String },
      inspectionRequired: { type: Boolean, default: true },
      depositRefundTimeline: { type: String }
    },
    // 13. Internet
    internetRules: {
      fairUsagePolicy: { type: Boolean, default: true },
      heavyUsageRestricted: { type: Boolean, default: false }
    },
    // 14. Custom
    additionalNotes: { type: String }
  },

  // --- 2. Location ---
  location: {
    district: { type: String, required: true, index: true },
    city: { type: String, required: true, index: true },
    address: { type: String, required: true }, // Full address
    privacyMode: { type: String, enum: ['Public', 'Private'], default: 'Public' },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    nearbyLandmarks: [{ type: String }]
  },

  // --- 3. Pricing & Bills (Defaults) ---
  pricingDefaults: {
    rentModel: { type: String, enum: ['Per Room', 'Per Bed'], required: true },
    deposit: {
      amount: { type: Number, default: 0 },
      refundable: { type: Boolean, default: true }
    },
    billingCycle: { type: String, default: 'Monthly' },
    rentDueDay: { type: Number },
    billsPolicy: { type: String, enum: ['Included', 'Separate', 'Partially Included'], required: true },
    utilities: {
      electricity: { type: String, enum: ['Included', 'Metered', 'Shared Split'] },
      water: { type: String, enum: ['Included', 'Shared Split'] },
      wifi: { type: String, enum: ['Included', 'Optional Extra', 'Not Available'] }
    },
    extraCharges: [{
      name: String, // e.g. "Parking"
      amount: Number
    }]
  },

  // --- 4. Facilities ---
  facilities: [{ type: String }], // e.g. ['Attached Bathroom', 'AC', 'Kitchen']

  // --- 5. Images ---
  images: [{ type: String }], // Array of URLs. First is Cover.

  // --- 6. Rooms / Units ---
  rooms: [{
    name: { type: String, required: true }, // e.g. "Room 101"
    type: { type: String, enum: ['Single', 'Double', 'Shared', 'Family'], required: true },
    occupancyMode: { type: String, enum: ['Entire Room', 'Per Bed'], required: true },
    capacity: { type: Number, required: true }, // Max people
    availableBeds: { type: Number }, // If shared

    // Pricing Overrides (Optional)
    price: { type: Number, required: true }, // Rent
    deposit: { type: Number },

    status: { type: String, enum: ['Available', 'Reserved', 'Occupied', 'Maintenance'], default: 'Available' },
    availableFrom: { type: Date },

    features: {
      bathroomType: { type: String, enum: ['Attached', 'Shared'] },
      furnishing: [{ type: String }]
    },
    images: [{ type: String }] // Room specific images
  }],

  // --- AI & Status ---
  aiEvaluation: {
    abusiveScore: { type: Number, default: 0 },
    fraudScore: { type: Number, default: 0 },
    completenessScore: { type: Number, default: 0 },
    flags: [{
      agent: String,
      message: String,
      severity: String // 'warn', 'block'
    }]
  },

  // Audit Log for Admin Review
  auditLog: [{
    action: { type: String, enum: ['flagged', 'approved', 'rejected', 'changes_requested'] },
    reason: String,
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // If manual
    aiFlag: Boolean, // If auto-flagged
    timestamp: { type: Date, default: Date.now }
  }],

  // --- 7. Verification & Agreements ---
  agreementTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'AgreementTemplate' },
  verificationStatus: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
  readyForReview: { type: Boolean, default: false },

  status: {
    type: String,
    enum: ['draft', 'pending_review', 'published', 'changes_requested', 'archived', 'hidden_by_audit', 'flagged', 'rejected', 'active'],
    default: 'draft',
    index: true
  },

  stats: {
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 }
  },

  viewCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// text index for search
ListingSchema.index({ title: 'text', description: 'text' });
// compound index for common filters
ListingSchema.index({ status: 1, price: 1, genderPreference: 1 });

export default mongoose.model('Listing', ListingSchema);
