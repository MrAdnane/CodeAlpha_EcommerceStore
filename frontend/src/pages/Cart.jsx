import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext.jsx';

export function totals(cart, discount = 0) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= 100 ? 0 : 9.99;
  return { subtotal, shipping, discount, total: subtotal + shipping - discount };
}

export default function Cart() {
  const { cart, cartSubtotal, updateQty, removeFromCart } = useShop();
  const navigate = useNavigate();
  const { subtotal, shipping, total } = totals(cart);

  if (cart.length === 0) {
    return (
      <div className="container page">
        <div className="empty"><h3>Your cart is empty</h3><p>Looks like you haven’t added anything yet.</p>
        <button className="btn" style={{ marginTop: 16 }} onClick={() => navigate('/products')}>Start Shopping</button></div>
      </div>
    );
  }

  return (
    <div className="container page">
      <h1 className="page-title">Shopping Cart</h1>
      <div className="cart-layout">
        <div>
          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              <img src={item.image} alt={item.name} onClick={() => navigate(`/products/${item.id}`)} style={{ cursor: 'pointer' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                <div style={{ color: 'var(--ink-2)', fontSize: 14 }}>${item.price.toFixed(2)} each</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                  <button className="qty-btn" aria-label="Decrease quantity" onClick={() => updateQty(item.id, -1)}>−</button>
                  <strong>{item.quantity}</strong>
                  <button className="qty-btn" aria-label="Increase quantity" onClick={() => updateQty(item.id, 1)}>+</button>
                  <button className="btn-ghost" onClick={() => removeFromCart(item.id)}>Remove</button>
                </div>
              </div>
              <strong>${(item.price * item.quantity).toFixed(2)}</strong>
            </div>
          ))}
        </div>
        <div className="summary-card">
          <h3>Order Summary</h3>
          <div className="summary-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span></div>
          {subtotal > 0 && subtotal < 100 && <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>Add ${(100 - subtotal).toFixed(2)} more for free shipping</p>}
          <div className="summary-row total"><span>Total</span><span>${total.toFixed(2)}</span></div>
          <button className="btn" style={{ width: '100%', marginTop: 16 }} onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
          <button className="btn-outline" style={{ width: '100%', marginTop: 8 }} onClick={() => navigate('/products')}>Continue Shopping</button>
        </div>
      </div>
    </div>
  );
}
