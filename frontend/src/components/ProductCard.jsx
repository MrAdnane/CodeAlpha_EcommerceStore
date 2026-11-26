import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext.jsx';

export function Stars({ rating }) {
  const filled = Math.round(rating || 0);
  return <span className="stars" aria-label={`${rating || 0} out of 5 stars`}>{'★'.repeat(filled)}{'☆'.repeat(5 - filled)}</span>;
}

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isWishlisted } = useShop();
  const discount = product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

  return (
    <article className="product-card" onClick={() => navigate(`/products/${product._id}`)}>
      <div className="product-img-wrap">
        <img className="product-img" src={product.image} alt={product.name} loading="lazy" />
        {product.badge && <span className="product-badge">{product.badge}</span>}
        {!product.badge && discount > 0 && <span className="product-badge sale">-{discount}%</span>}
        <button
          className={`wish-btn ${isWishlisted(product._id) ? 'saved' : ''}`}
          aria-label={isWishlisted(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
        >{isWishlisted(product._id) ? '♥' : '♡'}</button>
      </div>
      <div className="product-info">
        <div className="product-cat">{product.category}</div>
        <div className="product-name">{product.name}</div>
        <div><Stars rating={product.rating} /><span className="review-count">({product.numReviews})</span></div>
        <div className="product-footer">
          <div>
            <span className="price">${product.price.toFixed(2)}</span>
            {product.originalPrice > product.price && <span className="price-original">${product.originalPrice.toFixed(2)}</span>}
          </div>
          {product.stock > 0 ? (
            <button className="quick-add" aria-label={`Add ${product.name} to cart`} onClick={(e) => { e.stopPropagation(); addToCart(product, 1); }}>+</button>
          ) : (
            <span className="out-of-stock">Out of stock</span>
          )}
        </div>
      </div>
    </article>
  );
}
