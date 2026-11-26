import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useShop } from '../context/ShopContext.jsx';

export function OrderDetail() {
  const { id } = useParams();
  const { token } = useShop();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.getOrder(id, token).then(setOrder).catch((err) => setError(err.message));
  }, [id, token]);
  if (error) return <div className="container page"><p className="error">{error}</p></div>;
  if (!order) return <div className="container page"><div className="skeleton" /></div>;
  return (
    <div className="container page">
      <button className="link" onClick={() => navigate('/orders')}>← Back to Orders</button>
      <h1 className="page-title" style={{ marginTop: 16 }}>Order #{order._id.slice(-8).toUpperCase()}</h1>
      <p className="page-sub">Placed on {new Date(order.createdAt).toLocaleDateString()} · <span className="badge-status">{order.status}</span> · {order.paymentMethod}</p>
      <h2 style={{ marginBottom: 12 }}>Order Timeline</h2>
      {(order.timeline || []).map((t, i) => (
        <p key={i} style={{ padding: '6px 0' }}><strong>{t.status}</strong> — {t.message} · {new Date(t.date).toLocaleDateString()}</p>
      ))}
      <h2 style={{ margin: '24px 0 12px' }}>Items</h2>
      {order.items.map((item) => (
        <div key={item.product} className="cart-item">
          <img src={item.image} alt={item.name} />
          <div style={{ flex: 1 }}><strong>{item.name}</strong><div>Qty: {item.quantity} × ${item.price.toFixed(2)}</div></div>
          <strong>${(item.price * item.quantity).toFixed(2)}</strong>
        </div>
      ))}
      <div className="summary-card" style={{ maxWidth: 420 }}>
        <div className="summary-row"><span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
        <div className="summary-row"><span>Shipping</span><span>{order.shippingCost === 0 ? 'Free' : `$${order.shippingCost.toFixed(2)}`}</span></div>
        {order.discount > 0 && <div className="summary-row" style={{ color: 'var(--success)' }}><span>Discount</span><span>−${order.discount.toFixed(2)}</span></div>}
        <div className="summary-row total"><span>Total</span><span>${order.total.toFixed(2)}</span></div>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 8 }}>Shipping to: {order.shippingAddress.fullName}, {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.country}</p>
      </div>
    </div>
  );
}

export default function Orders() {
  const { user, token } = useShop();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.getMyOrders(token).then(setOrders).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [user, token]);
  if (!user) return <div className="container page"><div className="empty"><h3>Sign in to see your orders</h3><button className="btn" style={{ marginTop: 16 }} onClick={() => navigate('/login')}>Sign In</button></div></div>;
  if (loading) return <div className="container page"><div className="skeleton" /></div>;
  return (
    <div className="container page">
      <h1 className="page-title">My Orders</h1>
      {error && <p className="error">{error}</p>}
      {orders.length === 0 ? (
        <div className="empty"><h3>No orders yet</h3><p>Your order history will appear here.</p><button className="btn" style={{ marginTop: 16 }} onClick={() => navigate('/products')}>Start Shopping</button></div>
      ) : orders.map((o) => (
        <div key={o._id} className="cart-item" onClick={() => navigate(`/orders/${o._id}`)} style={{ cursor: 'pointer' }}>
          <div style={{ flex: 1 }}>
            <strong>Order #{o._id.slice(-8).toUpperCase()}</strong>
            <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{new Date(o.createdAt).toLocaleDateString()} · {o.items.length} item{o.items.length > 1 ? 's' : ''} · {o.paymentMethod}</div>
          </div>
          <span className="badge-status">{o.status}</span>
          <strong>${o.total.toFixed(2)}</strong>
        </div>
      ))}
    </div>
  );
}
