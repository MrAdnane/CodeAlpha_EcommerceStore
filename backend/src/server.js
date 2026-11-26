require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Fail fast with a clear message if required config is missing.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change-this-to-a-long-random-secret') {
  console.error('JWT_SECRET is not set. Copy .env.example to .env and set a long random secret.');
  process.exit(1);
}
if (process.env.USE_MEMORY_DB !== 'true' && !process.env.MONGO_URI) {
  console.error('MONGO_URI is not set. Copy .env.example to .env, or set USE_MEMORY_DB=true for local testing.');
  process.exit(1);
}

const app = express();

// Security headers. CSP allows our own scripts/styles, Google Fonts,
// and product images from any https source (Unsplash).
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'https:', 'data:'],
      connectSrc: ["'self'"],
    },
  },
}));
app.use(compression());
// CORS is restricted to the frontend origin — never open to everyone.
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting: 200 API requests / 15 min, 20 auth attempts / 15 min.
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { message: 'Too many requests, please try again in 15 minutes.' } }));
app.use('/api/auth/', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { message: 'Too many login attempts, please try again later.' } }));

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/newsletter', require('./routes/newsletter'));

// API 404 — anything under /api that is not a route.
app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found' }));

// API only — the backend never serves the frontend, in dev or production.
// The React frontend runs on Vite (dev, port 5173) or Vercel (production)
// and calls this API via VITE_API_URL, or via the Vite /api proxy in dev.

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  // Local testing only: an in-memory database starts empty on every
  // server start, so seed it automatically if it has no products.
  // With a real MONGO_URI this never runs — use "npm run seed" there.
  // Auto-seed is best-effort: if SEED_* env vars are missing it logs
  // a warning and the shop simply starts empty.
  if (process.env.USE_MEMORY_DB === 'true') {
    try {
      const Product = require('./models/Product');
      if ((await Product.countDocuments()) === 0) {
        const seed = require('./seed/seed');
        await seed({ close: false });
      }
    } catch (err) {
      console.log(`Auto-seed skipped: ${err.message}`);
    }
  }
  app.listen(PORT, () => console.log(`Vera API running on http://localhost:${PORT}`));
}

// Only start when run directly — the test script imports the app.
if (require.main === module) start().catch((err) => { console.error(err); process.exit(1); });

module.exports = app;
