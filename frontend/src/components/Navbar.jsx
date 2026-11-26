import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext.jsx';
import { api } from '../api.js';

export default function Navbar() {
  const { user, cartCount, wishlist, logout, showToast } = useShop();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const search = async (value) => {
    setQuery(value);
    if (value.trim().length < 2) { setResults([]); return; }
    try {
      const data = await api.getProducts(`?search=${encodeURIComponent(value)}&limit=5`);
      setResults(data.products);
    } catch { setResults([]); }
  };

  return (
    <header>
      <div className="announce">Free shipping over $100 · Cash on Delivery available · Use code SAVE10 for 10% off</div>
      <div className="navbar">
        <div className="nav-inner">
          <Link to="/" className="nav-logo">Vera</Link>
          <nav className="nav-links" aria-label="Main">
            <button onClick={() => navigate('/products')}>Shop All</button>
            <button onClick={() => navigate('/products?category=Electronics')}>Electronics</button>
            <button onClick={() => navigate('/products?category=Clothing')}>Clothing</button>
            <button onClick={() => navigate('/products?category=Home & Garden')}>Home</button>
            <button onClick={() => navigate('/products?category=Beauty')}>Beauty</button>
          </nav>
          <div className="nav-search">
            <input
              type="search" value={query} placeholder="Search products…"
              aria-label="Search products"
              onChange={(e) => search(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { navigate(`/products?search=${encodeURIComponent(query)}`); setResults([]); } }}
            />
            {results.length > 0 && (
              <div className="search-drop">
                {results.map((p) => (
                  <button key={p._id} onClick={() => { navigate(`/products/${p._id}`); setResults([]); setQuery(''); }}>
                    <img src={p.image} alt="" />
                    <span>{p.name}<br /><strong>${p.price.toFixed(2)}</strong></span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="nav-actions">
            <button className="icon-btn" onClick={() => navigate('/wishlist')} aria-label="Wishlist">
              Wishlist {wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
            </button>
            <button className="icon-btn" onClick={() => navigate('/cart')} aria-label="Cart">
              Cart {cartCount > 0 && <span className="badge">{cartCount}</span>}
            </button>
            {user ? (
              <>
                <button className="icon-btn" onClick={() => navigate('/profile')}>Hi, {user.name.split(' ')[0]}</button>
                {user.role === 'admin' && <button className="icon-btn" onClick={() => navigate('/admin')}>Admin</button>}
                <button className="icon-btn" onClick={() => { logout(); showToast('Signed out', 'info'); navigate('/'); }}>Sign Out</button>
              </>
            ) : (
              <>
                <button className="icon-btn" onClick={() => navigate('/login')}>Sign In</button>
                <button className="btn btn-sm" onClick={() => navigate('/register')}>Sign Up</button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
