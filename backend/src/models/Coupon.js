const mongoose = require('mongoose');

// Real coupons, managed by admins — not a hardcoded string in code.
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 20 },
  percent: { type: Number, required: true, min: 1, max: 100 },
  active: { type: Boolean, default: true },
  minOrder: { type: Number, default: 0, min: 0 },
  expiresAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
