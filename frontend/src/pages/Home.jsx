import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import ProductCard, { Stars } from '../components/ProductCard.jsx';

const CATEGORIES = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Beauty', 'Books'];

export default function Home() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [best, setBest] = useState([]);
  const [latest, setLatest] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [f, b, n] = await Promise.all([
          api.getProducts('?featured=true&limit=4'),
          api.getProducts('?sort=rating&limit=4'),
          api.getProducts('?sort=newest&limit=4'),
        ]);
        setFeatured(f.products); setBest(b.products); setLatest(n.products);
        // Real reviews only: collect review objects from the newest products.
        const all = [];
        for (const p of [...f.products, ...b.products]) {
          try {
            const full = await api.getProduct(p._id);
            for (const r of full.reviews || []) all.push({ ...r, productName: p.name });
          } catch { /* skip a product that fails to load */ }
        }
        setReviews(all.slice(0, 3));
      } catch (err) { setError(err.message); }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="container page"><div className="skeleton" /></div>;
  if (error) return <div className="container page"><p className="error">{error}</p></div>;

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div>
            <span className="hero-eyebrow">New Season Collection</span>
            <h1 className="hero-title">Shop Smarter.<br /><em>Live Better.</em></h1>
            <p className="hero-desc">Curated products from brands we trust, delivered to your door with care. Pay in cash when your order arrives.</p>
            <div className="hero-actions">
              <button className="btn" onClick={() => navigate('/products')}>Explore Collection</button>
              <button className="btn-outline" onClick={() => navigate('/products?category=Electronics')}>View Electronics</button>
            </div>
            <div className="hero-stats">
              <div><strong>12+</strong><span>Curated products</span></div>
              <div><strong>Free</strong><span>Shipping over $100</span></div>
              <div><strong>COD</strong><span>Cash on Delivery</span></div>
            </div>
          </div>
          <img className="hero-img" src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&q=80&auto=format&fit=crop" alt="Featured product — Smart Fitness Watch Pro" />
        </div>
      </section>

      <div className="trust-bar">
        <div className="trust-item"><strong>Free Shipping</strong><span>On orders over $100</span></div>
        <div className="trust-item"><strong>30-Day Returns</strong><span>No questions asked</span></div>
        <div className="trust-item"><strong>Cash on Delivery</strong><span>Pay when it arrives</span></div>
        <div className="trust-item"><strong>Secure Checkout</strong><span>Your data stays yours</span></div>
      </div>

      <section className="section container">
        <h2 className="section-title">Shop by Category</h2>
        <div className="cat-row">
          {CATEGORIES.map((c) => (
            <button key={c} className="cat-pill" onClick={() => navigate(`/products?category=${encodeURIComponent(c)}`)}>{c}</button>
          ))}
        </div>
      </section>

      <section className="section container" style={{ paddingTop: 0 }}>
        <div className="section-head"><h2 className="section-title">Featured Products</h2><button className="link" onClick={() => navigate('/products')}>View all</button></div>
        <div className="products-grid">{featured.map((p) => <ProductCard key={p._id} product={p} />)}</div>
      </section>

      <section className="container" style={{ paddingBottom: 64 }}>
        <div className="promo">
          <h2>Save 10% with SAVE10</h2>
          <p>Apply the code at checkout and get 10% off your whole order. No minimum spend.</p>
          <button className="btn" onClick={() => navigate('/products')}>Shop Now</button>
        </div>
      </section>

      <section className="section container" style={{ paddingTop: 0 }}>
        <div className="section-head"><h2 className="section-title">Best Sellers</h2><button className="link" onClick={() => navigate('/products?sort=rating')}>View all</button></div>
        <div className="products-grid">{best.map((p) => <ProductCard key={p._id} product={p} />)}</div>
      </section>

      <section className="section container" style={{ paddingTop: 0 }}>
        <div className="section-head"><h2 className="section-title">New Arrivals</h2><button className="link" onClick={() => navigate('/products?sort=newest')}>View all</button></div>
        <div className="products-grid">{latest.map((p) => <ProductCard key={p._id} product={p} />)}</div>
      </section>

      <section className="section container" style={{ paddingTop: 0 }}>
        <div className="story">
          <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80&auto=format&fit=crop" alt="Inside a Vera store" />
          <div>
            <h2>Our story</h2>
            <p>Vera started with a simple idea: a small shop, carefully chosen products, and no tricks. Every item in the catalogue is something we would buy ourselves.</p>
            <p>We keep the range small on purpose, we check every product before it is listed, and we answer every order ourselves. That is the whole business model.</p>
          </div>
        </div>
      </section>

      <section className="section container" style={{ paddingTop: 0 }}>
        <h2 className="section-title">What Customers Say</h2>
        <p className="section-sub">Real reviews from real orders — shown only when they exist.</p>
        {reviews.length === 0 ? (
          <div className="empty"><h3>No customer reviews yet</h3><p>Be the first to review a product after your order arrives.</p></div>
        ) : (
          <div className="testi-grid">
            {reviews.map((r) => (
              <div key={r._id} className="testi-card">
                <Stars rating={r.rating} />
                <p>“{r.comment}”</p>
                <strong>{r.name}</strong><span>Verified buyer · {r.productName}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
