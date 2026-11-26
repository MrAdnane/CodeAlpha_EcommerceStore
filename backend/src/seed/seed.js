require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const Subscriber = require('../models/Subscriber');

const img = (id) => `https://images.unsplash.com/${id}?w=800&q=80&auto=format&fit=crop`;

// 12 real products, in USD. Rating / numReviews are NOT set here —
// they start at 0 and are computed from real reviews only.
const products = [
  { name: 'Premium Wireless Headphones', description: 'Industry-leading noise cancellation with 30-hour battery life and premium Hi-Res audio. Foldable design with carrying case included.', price: 199.99, originalPrice: 279.99, category: 'Electronics', images: [img('photo-1505740420928-5e560c06d30e'), img('photo-1484704849700-f032a568e944')], stock: 25, featured: true, badge: 'Best Seller', tags: ['audio', 'wireless', 'noise-cancelling'] },
  { name: 'Smart Fitness Watch Pro', description: 'Advanced health tracking with ECG, blood oxygen monitoring, GPS, and 7-day battery. Water resistant to 50m.', price: 249.99, originalPrice: 349.99, category: 'Electronics', images: [img('photo-1523275335684-37898b6baf30')], stock: 40, featured: true, badge: 'New', tags: ['smartwatch', 'fitness', 'health'] },
  { name: 'Minimalist Leather Sneakers', description: 'Hand-crafted full-grain leather with memory foam insoles. Versatile design that transitions from casual to semi-formal effortlessly.', price: 129.99, originalPrice: 179.99, category: 'Clothing', images: [img('photo-1542291026-7eec264c27ff')], stock: 60, featured: true, badge: 'Trending', tags: ['shoes', 'leather', 'minimal'] },
  { name: 'Portable Espresso Maker', description: 'Barista-quality espresso anywhere. Uses Nespresso-compatible pods or ground coffee. Built-in 80ml water tank.', price: 89.99, originalPrice: 0, category: 'Home & Garden', images: [img('photo-1559056199-641a0ac8b55e')], stock: 35, featured: true, tags: ['coffee', 'espresso', 'portable'] },
  { name: 'Ultra-Wide Curved Monitor', description: '34 inch 4K UHD curved display with 144Hz refresh rate, 1ms response time, and HDR10 support. Perfect for gaming and creative work.', price: 699.99, originalPrice: 899.99, category: 'Electronics', images: [img('photo-1527443224154-c4a3942d3acf')], stock: 12, featured: false, badge: 'Sale', tags: ['monitor', 'gaming', '4k'] },
  { name: 'Linen Button-Down Shirt', description: 'Premium 100% linen, garment-washed for softness. Relaxed fit with mother-of-pearl buttons.', price: 64.99, originalPrice: 0, category: 'Clothing', images: [img('photo-1596755094514-f87e34085b2c')], stock: 80, featured: false, tags: ['linen', 'shirt', 'summer'] },
  { name: 'The Design of Everyday Things', description: 'The ultimate guide to human-centered design by Don Norman. A must-read for designers, engineers, and anyone who creates products.', price: 24.99, originalPrice: 0, category: 'Books', images: [img('photo-1544716278-ca5e3f4abd8c')], stock: 150, featured: false, tags: ['design', 'ux', 'product'] },
  { name: 'Ergonomic Mesh Office Chair', description: 'Full lumbar support with adjustable armrests, headrest, and seat depth. Breathable mesh back keeps you cool during long work sessions.', price: 449.99, originalPrice: 599.99, category: 'Home & Garden', images: [img('photo-1592078615290-033ee584e267')], stock: 15, featured: true, badge: 'Staff Pick', tags: ['chair', 'ergonomic', 'office'] },
  { name: 'Natural Skincare Essentials Kit', description: 'Complete 5-step routine with cleanser, toner, serum, moisturizer, and SPF. Formulated with 98% natural ingredients. Dermatologist tested.', price: 79.99, originalPrice: 110, category: 'Beauty', images: [img('photo-1571781926291-c477ebfd024b')], stock: 45, featured: true, badge: 'Eco-Friendly', tags: ['skincare', 'natural', 'beauty'] },
  { name: 'Trail Running Backpack 20L', description: 'Ultralight 20L hydration pack with integrated rain cover, trekking pole attachment, and emergency whistle. Fits up to 3L reservoir.', price: 94.99, originalPrice: 129.99, category: 'Sports', images: [img('photo-1553062407-98eeb64c6a62')], stock: 28, featured: false, tags: ['hiking', 'backpack', 'outdoor'] },
  { name: 'Mechanical Keyboard TKL', description: 'Tenkeyless layout with Cherry MX switches, per-key RGB lighting, and aircraft-grade aluminum frame. Includes braided USB-C cable.', price: 149.99, originalPrice: 199.99, category: 'Electronics', images: [img('photo-1587829741301-dc798b83add3')], stock: 30, featured: false, badge: 'Hot', tags: ['keyboard', 'mechanical', 'gaming'] },
  { name: 'Yoga Mat Premium Cork', description: 'Eco-friendly natural cork surface with rubber base. Superior grip when wet, naturally antimicrobial, 6mm cushioning. Includes carrying strap.', price: 69.99, originalPrice: 0, category: 'Sports', images: [img('photo-1588286840104-8957b019727f')], stock: 55, featured: false, tags: ['yoga', 'fitness', 'eco'] },
];

async function seed({ close = true } = {}) {
  // Seed accounts come from .env only — never publish real passwords.
  // Fail clearly if they are missing or still placeholders.
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const userEmail = process.env.SEED_USER_EMAIL;
  const userPassword = process.env.SEED_USER_PASSWORD;
  const placeholders = ['change-this-to-a-long-random-password', 'change-this-to-a-long-random-secret', ''];
  for (const [label, value] of [
    ['SEED_ADMIN_EMAIL', adminEmail], ['SEED_ADMIN_PASSWORD', adminPassword],
    ['SEED_USER_EMAIL', userEmail], ['SEED_USER_PASSWORD', userPassword],
  ]) {
    if (!value || placeholders.includes(value)) {
      throw new Error(`${label} is missing or still a placeholder. Set it in backend/.env — see .env.example.`);
    }
  }

  if (close) await connectDB();
  await Product.deleteMany({});
  await User.deleteMany({});
  await Order.deleteMany({});
  await Coupon.deleteMany({});
  await Subscriber.deleteMany({});

  await User.create([
    { name: 'Vera Admin', email: adminEmail, password: adminPassword, role: 'admin' },
    { name: 'Vera User', email: userEmail, password: userPassword, role: 'user' },
  ]);
  const created = await Product.insertMany(products.map((p) => ({ ...p, image: p.images[0] })));
  await Coupon.create({ code: 'SAVE10', percent: 10, active: true });

  console.log(`Seeded ${created.length} products`);
  console.log(`Admin: ${adminEmail}`);
  console.log(`User: ${userEmail}`);
  console.log('Coupon: SAVE10 (10% off)');
  if (close) {
    await mongoose.connection.close();
    if (global.__mongod) await global.__mongod.stop();
    process.exit(0);
  }
}

module.exports = seed;

if (require.main === module) {
  seed().catch((err) => { console.error(err.message); process.exit(1); });
}
