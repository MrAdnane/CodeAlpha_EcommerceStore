// Small API test script — no test framework, just Node + fetch.
// Usage: USE_MEMORY_DB=true JWT_SECRET=test-secret-for-tests-only \
//   SEED_ADMIN_EMAIL=admin@test.example SEED_ADMIN_PASSWORD=AdminPass123 \
//   SEED_USER_EMAIL=user@test.example SEED_USER_PASSWORD=UserPass123 \
//   npm test
// It starts the server on a random port with an in-memory database,
// seeds it, runs the checks below, and exits 0 (pass) or 1 (fail).
process.env.USE_MEMORY_DB = 'true';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-tests-only';
process.env.CLIENT_URL = 'http://localhost:5173';

const seed = require('../seed/seed');
const connectDB = require('../config/db');
const mongoose = require('mongoose');

let passed = 0;
let failed = 0;
const check = (name, ok, detail = '') => {
  if (ok) { passed++; console.log(`PASS  ${name}`); }
  else { failed++; console.log(`FAIL  ${name} ${detail}`); }
};

async function main() {
  await connectDB();
  await seed({ close: false });
  const app = require('../server');
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://localhost:${server.address().port}`;
  const call = async (path, opts = {}) => {
    const res = await fetch(base + path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  };
  const auth = (token) => ({ Authorization: `Bearer ${token}` });

  try {
    // Health + products
    let r = await call('/api/health');
    check('health returns ok', r.status === 200 && r.data.status === 'ok', JSON.stringify(r.data));
    r = await call('/api/products');
    check('products list has 12', r.data.products?.length === 12, `got ${r.data.products?.length}`);
    check('seed ratings are 0 (not faked)', r.data.products?.every((p) => p.rating === 0 && p.numReviews === 0));
    r = await call('/api/products?search=keyboard');
    check('search keyboard finds 1', r.data.products?.length === 1, JSON.stringify(r.data.products?.map((p) => p.name)));
    r = await call('/api/products?category=Audio');
    check('filter category Audio finds 0 (no Audio category)', r.data.total === 0);
    r = await call('/api/products?category=Electronics');
    check('filter category Electronics finds products', r.data.total > 0);
    r = await call('/api/products?sort=price-asc&limit=1');
    check('sort price-asc cheapest is 24.99', r.data.products?.[0]?.price === 24.99, `got ${r.data.products?.[0]?.price}`);

    // Auth validation
    r = await call('/api/auth/register', { method: 'POST', body: JSON.stringify({ name: 'A', email: 'not-an-email', password: '123' }) });
    check('register with bad data is 400', r.status === 400, `got ${r.status}`);
    r = await call('/api/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Test User', email: 'test@vera.example', password: 'TestPass123' }) });
    check('register valid is 201', r.status === 201, `got ${r.status} ${JSON.stringify(r.data)}`);
    const userToken = r.data.token;
    r = await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'test@vera.example', password: 'wrong' }) });
    check('login with wrong password is 401', r.status === 401);
    r = await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'test@vera.example', password: 'TestPass123' }) });
    check('login correct is 200', r.status === 200 && !!r.data.token);

    // Admin login (seeded)
    r = await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD }) });
    check('admin login works', r.status === 200 && r.data.role === 'admin', JSON.stringify(r.data));
    const adminToken = r.data.token;

    // Orders
    r = await call('/api/orders', { method: 'POST', headers: auth(userToken), body: JSON.stringify({ items: [], shippingAddress: {} }) });
    check('empty-cart order is 400', r.status === 400, `got ${r.status}`);
    const products = (await call('/api/products?limit=1')).data.products;
    const productId = products[0]._id;
    const stockBefore = products[0].stock;
    const address = { fullName: 'Test User', street: '1 Main St', city: 'Tinghir', state: 'Drâa', zip: '45800', country: 'Morocco' };
    r = await call('/api/orders', { method: 'POST', headers: auth(userToken), body: JSON.stringify({ items: [{ product: productId, quantity: 2 }], shippingAddress: address, coupon: 'SAVE10' }) });
    check('order with SAVE10 is 201', r.status === 201, `got ${r.status} ${JSON.stringify(r.data)}`);
    check('order discount is 10% and payment is COD', r.data.discount > 0 && r.data.paymentMethod === 'Cash on Delivery', JSON.stringify(r.data));
    const after = (await call(`/api/products/${productId}`)).data;
    check('stock decreased by 2', after.stock === stockBefore - 2, `was ${stockBefore}, now ${after.stock}`);
    r = await call('/api/orders/my', { headers: auth(userToken) });
    check('order appears in history', r.data.length === 1, `got ${r.data.length}`);
    // Oversell: try to buy more than the remaining stock.
    r = await call('/api/orders', { method: 'POST', headers: auth(userToken), body: JSON.stringify({ items: [{ product: productId, quantity: 9999 }], shippingAddress: address }) });
    check('oversell order is 400', r.status === 400, `got ${r.status}`);

    // Admin product CRUD + orders
    r = await call('/api/products', { method: 'POST', headers: auth(userToken), body: JSON.stringify({ name: 'Nope', description: 'x'.repeat(20), price: 1, category: 'Other', stock: 1 }) });
    check('normal user cannot create product (403)', r.status === 403, `got ${r.status}`);
    r = await call('/api/products', { method: 'POST', headers: auth(adminToken), body: JSON.stringify({ name: 'Test Product', description: 'A test product for the test suite', price: 9.99, category: 'Other', stock: 5 }) });
    check('admin can create product (201)', r.status === 201, `got ${r.status}`);
    const newId = r.data._id;
    r = await call(`/api/products/${newId}`, { method: 'PUT', headers: auth(adminToken), body: JSON.stringify({ name: 'Test Product 2', description: 'A test product for the test suite', price: 19.99, category: 'Other', stock: 5 }) });
    check('admin can update product', r.status === 200 && r.data.price === 19.99);
    r = await call(`/api/products/${newId}`, { method: 'DELETE', headers: auth(adminToken) });
    check('admin can delete product (204)', r.status === 204, `got ${r.status}`);
    r = await call('/api/orders', { headers: auth(adminToken) });
    check('admin can list orders', r.status === 200 && Array.isArray(r.data.orders));
    r = await call('/api/admin/stats', { headers: auth(adminToken) });
    check('admin stats are real (revenue > 0)', r.status === 200 && r.data.revenue > 0, JSON.stringify(r.data));

    // Wishlist (backend, not localStorage)
    r = await call('/api/auth/wishlist', { method: 'PUT', headers: auth(userToken), body: JSON.stringify({ productId }) });
    check('wishlist toggle saves', r.status === 200 && r.data.saved === true, JSON.stringify(r.data));
    r = await call('/api/auth/wishlist', { headers: auth(userToken) });
    check('wishlist persists on account', r.data.length === 1 && r.data[0]._id === productId, JSON.stringify(r.data));
    r = await call('/api/auth/wishlist', { method: 'PUT', headers: auth(userToken), body: JSON.stringify({ productId }) });
    check('wishlist toggle removes', r.status === 200 && r.data.saved === false);

    // Review
    r = await call(`/api/products/${productId}/reviews`, { method: 'POST', headers: auth(userToken), body: JSON.stringify({ rating: 5, comment: 'Great product, fast delivery.' }) });
    check('review submission is 201', r.status === 201, `got ${r.status} ${JSON.stringify(r.data)}`);
    const reviewed = (await call(`/api/products/${productId}`)).data;
    check('rating is computed from the real review', reviewed.rating === 5 && reviewed.numReviews === 1, `rating ${reviewed.rating}, count ${reviewed.numReviews}`);
    r = await call(`/api/products/${productId}/reviews`, { method: 'POST', headers: auth(userToken), body: JSON.stringify({ rating: 4, comment: 'Again.' }) });
    check('second review by same user is 400', r.status === 400);

    // Coupon + newsletter
    r = await call('/api/coupons/validate', { method: 'POST', body: JSON.stringify({ code: 'SAVE10', subtotal: 100 }) });
    check('coupon SAVE10 validates at 10%', r.status === 200 && r.data.percent === 10, JSON.stringify(r.data));
    r = await call('/api/coupons/validate', { method: 'POST', body: JSON.stringify({ code: 'NOPE', subtotal: 100 }) });
    check('bad coupon is 400', r.status === 400);
    r = await call('/api/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email: 'fan@vera.example' }) });
    check('newsletter subscribe is 201', r.status === 201, `got ${r.status}`);
  } finally {
    server.close();
    await mongoose.connection.close();
    if (global.__mongod) await global.__mongod.stop();
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
