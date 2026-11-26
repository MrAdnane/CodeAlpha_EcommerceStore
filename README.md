# Vera — Modern E-Commerce Platform

**CodeAlpha_EcommerceStore** — a premium, full-stack e-commerce platform built with Node.js, Express.js, MongoDB, React and Vite. A complete rebuild from zero of the original Vera internship project, keeping the same repository name.

> Live demo: **not deployed yet** — the API and frontend have been tested locally only. See [Deployment](#deployment) for how to deploy it.

## What it does

Vera is a real shop, not a demo with fake buttons:

- **Shop:** product grid with search (including autocomplete), category and price filters, sorting, pagination, quick add to cart, wishlist, product detail with image gallery, quantity selector, ratings and reviews, related products and recently viewed.
- **Cart & checkout:** persistent cart, quantity updates, subtotal / shipping / total, real coupon codes (SAVE10 = 10% off, stored in the database), shipping address form with validation, order summary, free shipping over $100 (otherwise $9.99), order confirmation and order timeline. **Cash on Delivery only** — no card or PayPal, and no simulated payments.
- **Account:** register / login / logout, profile and address management, password update, order history with detail and timeline, and a wishlist that lives on the account in the backend (not in localStorage).
- **Admin dashboard:** overview with real stats computed from the database (revenue, orders, products, customers, recent orders, low stock), product CRUD, order management with status updates, customer list, coupon management, review moderation, and newsletter subscribers.
- **Newsletter:** a real endpoint that stores subscribers in MongoDB.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, React Router, plain CSS, Context for auth/cart |
| Backend | Node.js, Express.js, Mongoose |
| Database | MongoDB (Atlas in production, in-memory for local tests) |
| Auth | JWT + bcryptjs (12 rounds) |
| Security | Helmet with CSP, CORS restricted to the frontend origin, express-rate-limit, express-validator |

## Project structure

```
vera/
├── backend/
│   ├── src/
│   │   ├── config/       # db.js, constants.js
│   │   ├── controllers/  # auth, products, orders, admin
│   │   ├── middleware/   # auth, validate, error
│   │   ├── models/       # User, Product, Order, Coupon, Subscriber
│   │   ├── routes/       # auth, products, orders, admin, coupons, newsletter
│   │   ├── seed/seed.js  # 12 products, admin + user accounts, SAVE10 coupon
│   │   ├── test/api.test.js
│   │   └── server.js     # API only — never serves the frontend
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/ShopContext.jsx  # auth, cart, wishlist
│   │   ├── components/   # Navbar, ProductCard, Footer
│   │   └── pages/        # Home, Products, ProductDetail, Cart, Checkout,
│   │                     # Orders, Wishlist, Profile, Auth, Admin
│   ├── vite.config.js    # /api proxy to localhost:5000 in dev
│   └── package.json
└── README.md
```

## Setup — local

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: set JWT_SECRET, and either MONGO_URI (Atlas) or USE_MEMORY_DB=true.
# For seed accounts, set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD and
# SEED_USER_EMAIL / SEED_USER_PASSWORD to strong passwords you choose.
# The seed refuses to run if they are missing or still placeholders.
npm run seed    # loads 12 products, 2 users and the SAVE10 coupon
npm run dev     # API at http://localhost:5000
```

Local testing without a MongoDB server:

```bash
# in backend/.env
USE_MEMORY_DB=true
JWT_SECRET=<a long random secret>
```

With `USE_MEMORY_DB=true` the server seeds the 12 products automatically on first start (if the seed accounts are set in `.env`); otherwise it starts empty and logs a warning.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev     # shop at http://localhost:5173
```

In development Vite forwards `/api` to `http://localhost:5000`, so no API URL is needed. In production set `VITE_API_URL` to the deployed API URL (no trailing slash) — see `.env.example`.

### Tests

```bash
cd backend
npm test
```

This starts the server with an in-memory database, seeds it, and checks health, products, search/filter/sort, auth validation, orders, stock decrease, oversell protection, admin CRUD, admin stats, wishlist persistence, reviews, coupons and newsletter. See `backend/src/test/api.test.js` for the full list.

## API reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | — | Register |
| POST | /api/auth/login | — | Login |
| GET / PUT | /api/auth/profile | User | Profile |
| PUT | /api/auth/password | User | Change password |
| GET / PUT | /api/auth/wishlist | User | Wishlist (backend) |
| GET | /api/products | — | List products (filter / sort / paginate) |
| GET | /api/products/:id | — | Product detail + reviews |
| POST / PUT / DELETE | /api/products | Admin | Product CRUD |
| POST | /api/products/:id/reviews | User | Add a review |
| POST | /api/orders | User | Place order (Cash on Delivery) |
| GET | /api/orders/my | User | My orders |
| GET | /api/orders/:id | User / Admin | Order detail |
| GET | /api/orders | Admin | All orders |
| PUT | /api/orders/:id/status | Admin | Update order status |
| POST | /api/coupons/validate | — | Validate a coupon code |
| GET | /api/admin/stats | Admin | Dashboard stats |
| GET | /api/admin/customers | Admin | Customers |
| GET / POST / PUT / DELETE | /api/admin/coupons | Admin | Coupons |
| GET / DELETE | /api/admin/reviews | Admin | Review moderation |
| GET | /api/admin/subscribers | Admin | Newsletter subscribers |
| POST | /api/newsletter/subscribe | — | Newsletter signup |

## Screenshots

TODO — add screenshots once the live demo is deployed. No screenshots exist yet; do not treat this section as complete.

## Deployment

Do **not** use Render — Render asks for a card even for the Free instance.

### Backend — SnapDeploy (free, no card)

1. Push this repo to GitHub as `CodeAlpha_EcommerceStore`.
2. In MongoDB Atlas, create a free M0 cluster, a database user, network access `0.0.0.0/0`, and copy the connection string.
3. In SnapDeploy, sign up with GitHub, Deploy → pick the repo, branch `master`/`main`, **Root directory: `backend`**, name e.g. `vera-api`, size Small (512 MB, free).
4. Environment variables (in SnapDeploy only, never in chat or in the repo):
   - `MONGO_URI` = Atlas connection string, database name `vera`
   - `JWT_SECRET` = long random secret
   - `CLIENT_URL` = your Vercel URL (update after the frontend is deployed)
   - `NODE_ENV=production`
   - Do **not** set `USE_MEMORY_DB` in production.
5. Deploy, wait for RUNNING, then check `https://<name>.containers.snapdeploy.app/api/health` → `{"status":"ok"}`.
6. Seed the database once, from your own computer: in `backend/`, set the same `MONGO_URI` in `.env` and run `npm run seed`. SnapDeploy has no shell, so seeding is done locally against Atlas.

### Frontend — Vercel (free, no card)

1. In Vercel, New Project → import the same repo, **Root directory: `frontend`**, build `npm run build`, output `dist`.
2. Environment variable: `VITE_API_URL` = your SnapDeploy API URL, no trailing slash.
3. Deploy, copy the Vercel URL.
4. Go back to SnapDeploy and set `CLIENT_URL` to that Vercel URL, then redeploy the backend — otherwise the shop will be blocked by CORS.

## What I learned

- A premium store is mostly invisible work: atomic stock updates, server-side price and coupon checks, and validation on every write — the UI is the easy part.
- Wishlist, cart and auth state have to live in one place (Context + backend) or they drift apart, as the old Vera wishlist did.
- Fake features are worse than missing ones: a card payment button that charges nothing, or a review count with no reviews, breaks trust faster than an empty state.
- Deployment choices matter early: an API that serves the frontend from the same process cannot be split across hosts later without rework, so this rebuild keeps the backend API-only from the start.

## Notes / limits

- Cash on Delivery only — there is no real payment provider.
- The free SnapDeploy container sleeps after 15 minutes idle; the first visit after a pause takes about 60–90 seconds to wake.
- Product photos are Unsplash URLs, not self-hosted.
