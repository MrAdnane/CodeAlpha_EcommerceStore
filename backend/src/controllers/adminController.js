const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Subscriber = require('../models/Subscriber');

// Dashboard stats — computed from the database, never hardcoded.
exports.getStats = async (req, res, next) => {
  try {
    const [orders, products, customers] = await Promise.all([
      Order.find({ status: { $ne: 'Cancelled' } }),
      Product.find(),
      User.countDocuments({ role: 'user' }),
    ]);
    const revenue = orders.reduce((sum, o) => sum + o.total, 0);
    const recentOrders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(5);
    const lowStock = products.filter((p) => p.stock <= 5).map((p) => ({ _id: p._id, name: p.name, stock: p.stock }));
    res.json({
      revenue, orders: orders.length,
      products: products.length, customers,
      recentOrders, lowStock,
    });
  } catch (err) { next(err); }
};

exports.getCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const query = { role: 'user' };
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
    const [customers, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      User.countDocuments(query),
    ]);
    res.json({ customers, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err) { next(err); }
};

// All reviews across all products, for moderation.
exports.getReviews = async (req, res, next) => {
  try {
    const products = await Product.find({ 'reviews.0': { $exists: true } }).populate('reviews.user', 'name email');
    const reviews = [];
    for (const p of products) {
      for (const r of p.reviews) {
        reviews.push({ _id: r._id, productId: p._id, productName: p.name, name: r.name, rating: r.rating, comment: r.comment, createdAt: r.createdAt });
      }
    }
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(reviews);
  } catch (err) { next(err); }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    product.reviews = product.reviews.filter((r) => r._id.toString() !== req.params.reviewId);
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.length
      ? product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length : 0;
    await product.save();
    res.json({ message: 'Review deleted' });
  } catch (err) { next(err); }
};

exports.getCoupons = async (req, res, next) => {
  try { res.json(await Coupon.find().sort({ createdAt: -1 })); }
  catch (err) { next(err); }
};

exports.createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create({
      code: req.body.code, percent: req.body.percent,
      active: req.body.active ?? true, minOrder: req.body.minOrder ?? 0,
      expiresAt: req.body.expiresAt || null,
    });
    res.status(201).json(coupon);
  } catch (err) { next(err); }
};

exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, {
      percent: req.body.percent, active: req.body.active,
      minOrder: req.body.minOrder, expiresAt: req.body.expiresAt || null,
    }, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json(coupon);
  } catch (err) { next(err); }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.status(204).json();
  } catch (err) { next(err); }
};

exports.getSubscribers = async (req, res, next) => {
  try { res.json(await Subscriber.find().sort({ createdAt: -1 })); }
  catch (err) { next(err); }
};
