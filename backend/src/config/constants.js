// Shared constants — one place, so backend and seed agree.
module.exports = {
  JWT_EXPIRES_IN: '30d',
  SALT_ROUNDS: 12,
  CATEGORIES: ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Beauty', 'Toys', 'Other'],
  ORDER_STATUSES: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
  // Cash on Delivery only. No card / PayPal / simulated payments.
  PAYMENT_METHODS: ['Cash on Delivery'],
  FREE_SHIPPING_THRESHOLD: 100,
  SHIPPING_COST: 9.99,
};
