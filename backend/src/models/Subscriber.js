const mongoose = require('mongoose');

// Newsletter subscribers — a real collection, not a fake toast.
const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Subscriber', subscriberSchema);
