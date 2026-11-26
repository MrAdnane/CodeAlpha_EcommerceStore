const mongoose = require('mongoose');
const { CATEGORIES } = require('../config/constants');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, maxlength: 1000 },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 2000 },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, default: 0, min: 0 },
  category: { type: String, required: true, enum: CATEGORIES },
  images: [{ type: String }],
  image: { type: String, default: '' },
  stock: { type: Number, required: true, min: 0, default: 0 },
  reviews: [reviewSchema],
  // Rating is computed from real reviews only — never hardcoded in seed.
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  badge: { type: String, default: '', maxlength: 30 },
  tags: [{ type: String }],
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
