import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useShop } from '../context/ShopContext.jsx';
import { totals } from './Cart.jsx';

export default function Checkout() {
  const { user, token, cart, clearCart, showToast } = useShop();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState('');
  const [couponInfo, setCouponInfo] = useState(null);
  const [couponMsg, setCouponMsg] = useState('');
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState({
    fullName: user?.name || '', street: user?.address?.street || '', city: user?.address?.city || '',
    state: user?.address?.state || '', zip: user?.address?.zip || '', country: user?.address?.country || 'USA',
  });

  if (!user) {
    return <div className="container page"><div className="empty"><h3>Sign in to check out</h3><p>You need an account to place an order.</p><button className="btn" style={{ marginTop: 16 }} onClick={() => navigate('/login')}>Sign In</button></div></div>;
  }
  if (cart.length === 0) {
    return <div className="container page"><div className="empty"><h3>Your cart is empty</h3><button className="btn" style={{ marginTop: 16 }} onClick={() => navigate('/products')}>Start Shopping</button></div></div>;
  }

  const discount = couponInfo ? (totals(cart).subtotal * couponInfo.percent) / 100 : 0;
  const { subtotal, shipping, total } = totals(cart, discount);

  const applyCoupon = async () => {
    setCouponMsg('');
    try {
      const data = await api.validateCoupon(coupon, subtotal);
      setCouponInfo(data);
      setCouponMsg(`Coupon ${data.code} applied — ${data.percent}% off.`);
    } catch (err) {
      setCouponInfo(null);
      setCouponMsg(err.message);
    }
  };

  const placeOrder = async () => {
    setError('');
    setPlacing(true);
    try {
      const order = await api.createOrder({
        items: cart.map((i) => ({ product: i.id, quantity: i.quantity })),
        shippingAddress: address,
        coupon: couponInfo ? couponInfo.code : '',
      }, token);
      clearCart();
      showToast('Order placed successfully', 'success');
      navigate(`/orders/${order._id}`);
    } catch (err) { setError(err.message); }
    setPlacing(false);
  };

  const set = (field) => (e) => setAddress({ ...address, [field]: e.target.value });

  return (
    <div className="container page">
      <h1 className="page-title">Checkout</h1>
      <div className="steps"><span>1 Cart</span><span>→</span><span className="active">2 Shipping</span><span>→</span><span>3 Confirm</span></div>
      <div className="cart-layout">
        <div className="form">
          {error && <p className="error">{error}</p>}
          <h2>Shipping Address</h2>
          <label>Full Name<input value={address.fullName} onChange={set('fullName')} required /></label>
          <label>Street Address<input value={address.street} onChange={set('street')} required /></label>
          <div className="form-row">
            <label>City<input value={address.city} onChange={set('city')} required /></label>
            <label>State<input value={address.state} onChange={set('state')} required /></label>
          </div>
          <div className="form-row">
            <label>ZIP Code<input value={address.zip} onChange={set('zip')} required /></label>
            <label>Country<input value={address.country} onChange={set('country')} required /></label>
          </div>
          <h2>Payment Method</h2>
          <p style={{ fontSize: 14, color: 'var(--ink-2)' }}>Cash on Delivery only — you pay in cash when your order arrives. No card details are ever asked for.</p>
          <h2>Coupon Code</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Try SAVE10" aria-label="Coupon code" />
            <button className="btn-outline" type="button" onClick={applyCoupon}>Apply</button>
          </div>
          {couponMsg && <p>{couponMsg}</p>}
        </div>
        <div className="summary-card">
          <h3>Order Summary</h3>
          {cart.map((i) => (
            <div key={i.id} className="summary-row"><span>{i.name} × {i.quantity}</span><span>${(i.price * i.quantity).toFixed(2)}</span></div>
          ))}
          <div className="summary-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span></div>
          {discount > 0 && <div className="summary-row" style={{ color: 'var(--success)' }}><span>Coupon ({couponInfo.code})</span><span>−${discount.toFixed(2)}</span></div>}
          <div className="summary-row total"><span>Total</span><span>${total.toFixed(2)}</span></div>
          <button className="btn" style={{ width: '100%', marginTop: 16 }} disabled={placing} onClick={placeOrder}>
            {placing ? 'Placing order…' : 'Place Order — Cash on Delivery'}
          </button>
        </div>
      </div>
    </div>
  );
}
