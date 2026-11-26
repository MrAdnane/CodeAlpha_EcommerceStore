import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useShop } from '../context/ShopContext.jsx';
import ProductCard, { Stars } from '../components/ProductCard.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, addToCart, toggleWishlist, isWishlisted, showToast } = useShop();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [recent, setRecent] = useState([]);
  const [mainImg, setMainImg] = useState('');
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getProduct(id)
      .then((p) => {
        setProduct(p);
        setMainImg(p.images?.[0] || p.image);
        setQty(1);
        // Recently viewed, stored locally (browsing history only).
        const prev = JSON.parse(localStorage.getItem('vera_recent') || '[]')
          .filter((r) => r._id !== p._id);
        const next = [{ _id: p._id, name: p.name, price: p.price, image: p.image }, ...prev].slice(0, 8);
        localStorage.setItem('vera_recent', JSON.stringify(next));
        setRecent(next.slice(1));
        return api.getProducts(`?category=${encodeURIComponent(p.category)}&limit=6`);
      })
      .then((d) => setRelated(d.products.filter((r) => r._id !== id).slice(0, 4)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewMsg('');
    try {
      await api.addReview(id, { rating, comment }, token);
      setReviewMsg('Thank you — your review was added.');
      setComment('');
      const p = await api.getProduct(id);
      setProduct(p);
    } catch (err) { setReviewMsg(err.message); }
  };

  if (loading) return <div className="container page"><div className="skeleton" /></div>;
  if (error || !product) return <div className="container page"><p className="error">{error || 'Product not found'}</p><button className="btn-outline" onClick={() => navigate('/products')}>Back to shop</button></div>;

  const images = product.images?.length ? product.images : [product.image];
  const alreadyReviewed = user && product.reviews.some((r) => r.user?._id === user._id || r.user === user._id);
  const discount = product.originalPrice > product.price ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

  return (
    <div className="container page">
      <button className="link" onClick={() => navigate('/products')}>← Back to shop</button>
      <div className="detail-layout" style={{ marginTop: 20 }}>
        <div>
          <img className="detail-img" src={mainImg} alt={product.name} />
          {images.length > 1 && (
            <div className="thumbs">
              {images.map((img) => (
                <img key={img} src={img} alt="" className={img === mainImg ? 'active' : ''} onClick={() => setMainImg(img)} />
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="product-cat">{product.category}</div>
          <h1 className="detail-name">{product.name}</h1>
          <div><Stars rating={product.rating} /><span className="review-count">{product.numReviews} review{product.numReviews !== 1 ? 's' : ''}</span></div>
          <div style={{ marginTop: 12 }}>
            <span className="detail-price">${product.price.toFixed(2)}</span>
            {product.originalPrice > product.price && <span className="price-original">${product.originalPrice.toFixed(2)}</span>}
            {discount > 0 && <span style={{ color: 'var(--success)', fontWeight: 700, marginLeft: 8 }}>Save {discount}%</span>}
          </div>
          <div className="stock-bar"><div className="stock-fill" style={{ width: `${Math.min(100, (product.stock / 50) * 100)}%` }} /></div>
          <p style={{ fontSize: 13, color: product.stock > 5 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
            {product.stock > 0 ? (product.stock > 20 ? 'In stock' : `Only ${product.stock} left`) : 'Out of stock'}
          </p>
          <p style={{ margin: '16px 0', color: 'var(--ink-2)' }}>{product.description}</p>
          <div className="qty-wrap">
            <span>Quantity</span>
            <button className="qty-btn" aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
            <strong>{qty}</strong>
            <button className="qty-btn" aria-label="Increase quantity" onClick={() => setQty(Math.min(product.stock, qty + 1))}>+</button>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn" disabled={product.stock === 0} onClick={() => addToCart(product, qty)}>Add to Cart</button>
            <button className="btn-outline" onClick={() => toggleWishlist(product)}>{isWishlisted(product._id) ? 'Saved to Wishlist' : 'Add to Wishlist'}</button>
          </div>
          <div style={{ marginTop: 24, fontSize: 14, color: 'var(--ink-2)' }}>
            <p>Free shipping over $100 · 30-day returns · Cash on Delivery</p>
          </div>
        </div>
      </div>

      <section style={{ marginTop: 56 }}>
        <h2 className="section-title">Customer Reviews ({product.numReviews})</h2>
        {product.reviews.length === 0 ? (
          <p style={{ color: 'var(--ink-2)' }}>No reviews yet. Be the first to review this product.</p>
        ) : product.reviews.map((r) => (
          <div key={r._id} className="review-card">
            <strong>{r.name}</strong><Stars rating={r.rating} />
            <p style={{ marginTop: 6 }}>{r.comment}</p>
          </div>
        ))}
        {user && !alreadyReviewed && (
          <form className="form" onSubmit={submitReview} style={{ marginTop: 24 }}>
            <h3>Write a review</h3>
            <label>Rating
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
              </select>
            </label>
            <label>Your review
              <textarea rows="3" value={comment} onChange={(e) => setComment(e.target.value)} required minLength={2} maxLength={1000} />
            </label>
            <button className="btn" type="submit">Submit Review</button>
            {reviewMsg && <p>{reviewMsg}</p>}
          </form>
        )}
        {user && alreadyReviewed && <p style={{ marginTop: 16, color: 'var(--ink-2)' }}>You have already reviewed this product.</p>}
        {!user && <p style={{ marginTop: 16 }}>Sign in to write a review.</p>}
      </section>

      {related.length > 0 && (
        <section style={{ marginTop: 56 }}>
          <h2 className="section-title">You May Also Like</h2>
          <div className="products-grid">{related.map((p) => <ProductCard key={p._id} product={p} />)}</div>
        </section>
      )}
      {recent.length > 0 && (
        <section style={{ marginTop: 56 }}>
          <h2 className="section-title">Recently Viewed</h2>
          <div className="products-grid">{recent.map((r) => (
            <div key={r._id} className="product-card" onClick={() => navigate(`/products/${r._id}`)}>
              <div className="product-img-wrap"><img className="product-img" src={r.image} alt={r.name} /></div>
              <div className="product-info"><div className="product-name">{r.name}</div><span className="price">${r.price.toFixed(2)}</span></div>
            </div>
          ))}</div>
        </section>
      )}
    </div>
  );
}
