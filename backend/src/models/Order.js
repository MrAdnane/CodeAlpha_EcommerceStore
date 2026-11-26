const mongoose = require('mongoose');
const { ORDER_STATUSES, PAYMENT_METHODS } = require('../config/constants');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  image: String,
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const timelineSchema = new mongoose.Schema({
  status: String,
  message: String,
  date: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: {
    fullName: String, street: String, city: String,
    state: String, zip: String, country: String,
  },
  // Cash on Delivery only — no card / PayPal, no simulated payment.
  paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'Cash on Delivery' },
  couponCode: { type: String, default: '' },
  subtotal: { type: Number, required: true },
  shippingCost: { type: Number, default: 9.99 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  status: { type: String, enum: ORDER_STATUSES, default: 'Pending' },
  timeline: [timelineSchema],
  isPaid: { type: Boolean, default: false },
  isDelivered: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
