const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { SALT_ROUNDS } = require('../config/constants');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  // Wishlist lives on the account (backend), not in localStorage.
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  address: {
    street: String, city: String, state: String, zip: String, country: String,
  },
}, { timestamps: true });

// Hash the password before saving, only when it changed.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
