import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext.jsx';
import ProductCard from '../components/ProductCard.jsx';

export default function Wishlist() {
  const { user, wishlist } = useShop();
  const navigate = useNavigate();
  if (!user) {
    return <div className="container page"><div className="empty"><h3>Sign in to see your wishlist</h3><p>Your wishlist is saved on your account, so it follows you across devices.</p><button className="btn" style={{ marginTop: 16 }} onClick={() => navigate('/login')}>Sign In</button></div></div>;
  }
  return (
    <div className="container page">
      <h1 className="page-title">My Wishlist</h1>
      <p className="page-sub">Saved on your account — not just in this browser.</p>
      {wishlist.length === 0 ? (
        <div className="empty"><h3>Your wishlist is empty</h3><p>Save items you love to find them later.</p><button className="btn" style={{ marginTop: 16 }} onClick={() => navigate('/products')}>Browse Products</button></div>
      ) : (
        <div className="products-grid">{wishlist.map((p) => <ProductCard key={p._id} product={p} />)}</div>
      )}
    </div>
  );
}
