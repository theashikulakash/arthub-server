const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String }, // not required for Google/BetterAuth OAuth users
    photoURL: { type: String, default: '' },
    provider: { type: String, enum: ['credentials', 'google'], default: 'credentials' },
    role: { type: String, enum: ['user', 'artist', 'admin'], default: 'user' },
    subscriptionTier: { type: String, enum: ['free', 'pro', 'premium'], default: 'free' },
    purchaseCount: { type: Number, default: 0 },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artwork' }],
  },
  { timestamps: true }
);

// Max purchases allowed per tier
userSchema.methods.getMaxPurchases = function () {
  const limits = { free: 3, pro: 9, premium: Infinity };
  return limits[this.subscriptionTier];
};

module.exports = mongoose.model('User', userSchema);
