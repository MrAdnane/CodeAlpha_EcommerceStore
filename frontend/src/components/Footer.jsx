import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useShop } from '../context/ShopContext.jsx';

export default function Footer() {
  const navigate = useNavigate();
  const { showToast } = useShop();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const subscribe = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.subscribe(email);
      setMessage('Thank you — you are subscribed.');
      setEmail('');
    } catch (err) { setMessage(err.message); }
  };

  const shop = (category) => navigate(category ? `/products?category=${encodeURIComponent(category)}` : '/products');

  return (
    <>
      <section className="newsletter" aria-label="Newsletter">
        <div className="container">
          <h2 className="section-title">Join the Vera list</h2>
          <p className="section-sub">New arrivals, restocks and the SAVE10 offer. No spam, unsubscribe any time.</p>
          <form onSubmit={subscribe}>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" aria-label="Email address" />
            <button className="btn" type="submit">Subscribe</button>
          </form>
          {message && <p style={{ marginTop: 12 }}>{message}</p>}
        </div>
      </section>
      <footer className="footer">
        <div className="footer-grid">
          <div>
            <h3>Vera</h3>
            <p>Premium shopping for modern life. Curated products, honest prices, and cash on delivery.</p>
          </div>
          <div>
            <h4>Shop</h4>
            <button onClick={() => shop()}>All products</button>
            <button onClick={() => shop('Electronics')}>Electronics</button>
            <button onClick={() => shop('Clothing')}>Clothing</button>
            <button onClick={() => shop('Home & Garden')}>Home &amp; Garden</button>
            <button onClick={() => shop('Sports')}>Sports</button>
          </div>
          <div>
            <h4>Your account</h4>
            <button onClick={() => navigate('/orders')}>My orders</button>
            <button onClick={() => navigate('/wishlist')}>My wishlist</button>
            <button onClick={() => navigate('/cart')}>My cart</button>
            <button onClick={() => navigate('/profile')}>Profile</button>
          </div>
          <div>
            <h4>Help</h4>
            <button onClick={() => { navigate('/products'); showToast('Free shipping on orders over $100. Cash on Delivery only.', 'info'); }}>Shipping &amp; payment</button>
            <button onClick={() => navigate('/')}>About Vera</button>
            <button onClick={() => navigate('/products')}>Returns — 30 days, no questions asked</button>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Vera. All rights reserved.</span>
          <span>Cash on Delivery · Secure checkout · 30-day returns</span>
        </div>
      </footer>
    </>
  );
}
