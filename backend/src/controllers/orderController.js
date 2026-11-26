const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } = require('../config/constants');

// Look up a coupon code in the database (seeded SAVE10 is a real Coupon).
// Returns { code, discount } or { code: '', discount: 0 }.
async function couponDiscount(code, subtotal) {
  if (!code) return { code: '', discount: 0 };
  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), active: true });
  if (!coupon) return { code: '', discount: 0 };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { code: '', discount: 0 };
  if (subtotal < (coupon.minOrder || 0)) return { code: '', discount: 0 };
  return { code: coupon.code, discount: (subtotal * coupon.percent) / 100 };
}

exports.createOrder = async (req, res, next) => {
  const decremented = []; // products already decremented, to restore on failure
  try {
    const { items, shippingAddress, coupon } = req.body;
    if (!items?.length) return res.status(400).json({ message: 'No items in order' });

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ message: 'Quantity must be at least 1' });
      }
      // Atomic decrement: only succeeds if stock >= quantity at this moment,
      // so two simultaneous orders cannot both take the last item.
      const product = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { new: true },
      );
      if (!product) {
        // Restore anything already decremented, then fail cleanly.
        for (const d of decremented) {
          await Product.findByIdAndUpdate(d.id, { $inc: { stock: d.qty } });
        }
        return res.status(400).json({ message: 'Product not found or not enough stock' });
      }
      decremented.push({ id: product._id, qty });
      subtotal += product.price * qty;
      orderItems.push({
        product: product._id, name: product.name,
        image: product.image || product.images?.[0] || '',
        price: product.price, quantity: qty,
      });
    }

    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const { code, discount } = await couponDiscount(coupon, subtotal);
    const total = subtotal + shippingCost - discount;

    let order;
    try {
      order = await Order.create({
        user: req.user._id, items: orderItems, shippingAddress,
        paymentMethod: 'Cash on Delivery', couponCode: code,
        subtotal, shippingCost, discount, total,
        timeline: [{ status: 'Pending', message: 'Order placed successfully' }],
      });
    } catch (err) {
      // Order creation failed — give the stock back.
      for (const d of decremented) {
        await Product.findByIdAndUpdate(d.id, { $inc: { stock: d.qty } });
      }
      throw err;
    }

    res.status(201).json(order);
  } catch (err) { next(err); }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { next(err); }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(order);
  } catch (err) { next(err); }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};
    if (status && status !== 'All') query.status = status;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
    let orders = await Order.find(query).populate('user', 'name email').sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum).limit(limitNum);
    const total = await Order.countDocuments(query);
    if (search) {
      const q = search.toLowerCase();
      orders = orders.filter((o) => o._id.toString().toLowerCase().includes(q)
        || o.user?.name?.toLowerCase().includes(q)
        || o.user?.email?.toLowerCase().includes(q));
    }
    res.json({ orders, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err) { next(err); }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const previousStatus = order.status;
    order.status = status;
    const messages = {
      Processing: 'Your order is being prepared',
      Shipped: 'Your order is on the way!',
      Delivered: 'Order delivered successfully',
      Cancelled: 'Order has been cancelled',
    };
    order.timeline.push({ status, message: messages[status] || status });
    if (status === 'Delivered') order.isDelivered = true;
    // If an order is cancelled, return the items to stock.
    if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }
    await order.save();
    res.json(order);
  } catch (err) { next(err); }
};
