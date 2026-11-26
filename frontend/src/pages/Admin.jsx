import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useShop } from '../context/ShopContext.jsx';

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Beauty', 'Toys', 'Other'];
const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const EMPTY_PRODUCT = { name: '', description: '', price: '', originalPrice: '', category: 'Electronics', stock: '', images: '', featured: false, badge: '', tags: '' };

export default function Admin() {
  const { user, token, showToast } = useShop();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editing, setEditing] = useState(null); // product being edited, or 'new'
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [couponForm, setCouponForm] = useState({ code: '', percent: 10, minOrder: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    Promise.all([
      api.adminStats(token),
      api.getProducts('?limit=50'),
      api.adminOrders('?limit=20', token),
      api.adminCustomers('?limit=20', token),
      api.adminCoupons(token),
      api.adminReviews(token),
      api.adminSubscribers(token),
    ]).then(([s, p, o, c, cp, r, sub]) => {
      setStats(s); setProducts(p.products); setOrders(o.orders || o); setCustomers(c.customers); setCoupons(cp); setReviews(r); setSubscribers(sub);
    }).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [user, token]);

  if (!user) return <div className="container page"><div className="empty"><h3>Sign in to access the admin dashboard</h3><button className="btn" style={{ marginTop: 16 }} onClick={() => navigate('/login')}>Sign In</button></div></div>;
  if (user.role !== 'admin') return <div className="container page"><p className="error">Admin access required.</p></div>;
  if (loading) return <div className="container page"><div className="skeleton" /></div>;

  const refreshProducts = () => api.getProducts('?limit=50').then((d) => setProducts(d.products));
  const refreshOrders = () => api.adminOrders(`?limit=20${statusFilter !== 'All' ? `&status=${statusFilter}` : ''}`, token).then((d) => setOrders(d.orders || d));

  const saveProduct = async (e) => {
    e.preventDefault();
    const body = {
      ...form,
      price: Number(form.price), originalPrice: Number(form.originalPrice || 0), stock: Number(form.stock),
      images: form.images.split(',').map((s) => s.trim()).filter(Boolean),
      tags: form.tags ? form.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
    };
    try {
      if (editing === 'new') await api.adminCreateProduct(body, token);
      else await api.adminUpdateProduct(editing, body, token);
      showToast('Product saved', 'success');
      setEditing(null); setForm(EMPTY_PRODUCT);
      refreshProducts();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const deleteProduct = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try { await api.adminDeleteProduct(id, token); showToast('Product deleted', 'success'); refreshProducts(); }
    catch (err) { showToast(err.message, 'error'); }
  };

  const filteredOrders = orders.filter((o) =>
    (!search || o._id.toLowerCase().includes(search.toLowerCase()) || o.user?.name?.toLowerCase().includes(search.toLowerCase()))
    && (statusFilter === 'All' || o.status === statusFilter));

  const tabs = ['overview', 'products', 'orders', 'customers', 'coupons', 'reviews', 'subscribers'];

  return (
    <div className="container page">
      <h1 className="page-title">Admin Dashboard</h1>
      <p className="page-sub">Real numbers from the database — nothing here is hardcoded.</p>
      {error && <p className="error">{error}</p>}
      <div className="admin-layout">
        <nav className="admin-nav" aria-label="Admin">
          {tabs.map((t) => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </nav>
        <div>
          {tab === 'overview' && stats && (
            <>
              <div className="stat-grid">
                <div className="stat-card"><strong>${stats.revenue.toFixed(2)}</strong><span>Revenue (non-cancelled orders)</span></div>
                <div className="stat-card"><strong>{stats.orders}</strong><span>Orders</span></div>
                <div className="stat-card"><strong>{stats.products}</strong><span>Products</span></div>
                <div className="stat-card"><strong>{stats.customers}</strong><span>Customers</span></div>
              </div>
              <h2>Recent Orders</h2>
              {stats.recentOrders.map((o) => (
                <p key={o._id} style={{ padding: '6px 0' }}>#{o._id.slice(-8).toUpperCase()} — {o.user?.name} — ${o.total.toFixed(2)} — {o.status}</p>
              ))}
              <h2 style={{ marginTop: 24 }}>Low Stock (5 or fewer)</h2>
              {stats.lowStock.length === 0 ? <p>All products are well stocked.</p> : stats.lowStock.map((p) => (
                <p key={p._id} style={{ padding: '4px 0' }}>{p.name} — {p.stock} left</p>
              ))}
            </>
          )}

          {tab === 'products' && (
            <>
              <button className="btn" style={{ marginBottom: 16 }} onClick={() => { setEditing('new'); setForm(EMPTY_PRODUCT); }}>Add Product</button>
              {editing && (
                <form className="form" onSubmit={saveProduct} style={{ marginBottom: 24, border: '1px solid var(--border)', padding: 20, borderRadius: 12 }}>
                  <h3>{editing === 'new' ? 'New Product' : 'Edit Product'}</h3>
                  <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
                  <label>Description<textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></label>
                  <div className="form-row">
                    <label>Price ($)<input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></label>
                    <label>Original Price ($)<input type="number" step="0.01" min="0" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} /></label>
                  </div>
                  <div className="form-row">
                    <label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
                    <label>Stock<input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required /></label>
                  </div>
                  <label>Image URLs (comma separated)<input value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} placeholder="https://…" /></label>
                  <div className="form-row">
                    <label>Badge<input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} /></label>
                    <label>Tags (comma separated)<input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></label>
                  </div>
                  <label><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured product</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn" type="submit">Save Product</button>
                    <button className="btn-outline" type="button" onClick={() => setEditing(null)}>Cancel</button>
                  </div>
                </form>
              )}
              <table className="table">
                <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Category</th><th></th></tr></thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p._id}>
                      <td>{p.name}</td><td>${p.price.toFixed(2)}</td><td>{p.stock}</td><td>{p.category}</td>
                      <td>
                        <button className="btn-ghost" onClick={() => { setEditing(p._id); setForm({ ...p, images: (p.images || []).join(', '), tags: (p.tags || []).join(', ') }); }}>Edit</button>{' '}
                        <button className="btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => deleteProduct(p._id, p.name)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {tab === 'orders' && (
            <>
              <div className="toolbar">
                <input type="search" placeholder="Search by order id or customer…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search orders" />
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); }} aria-label="Filter by status">
                  <option>All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <button className="btn-outline btn-sm" onClick={refreshOrders}>Refresh</button>
              </div>
              {filteredOrders.length === 0 ? <div className="empty"><h3>No orders found</h3></div> : (
                <table className="table">
                  <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Change Status</th></tr></thead>
                  <tbody>
                    {filteredOrders.map((o) => (
                      <tr key={o._id}>
                        <td>#{o._id.slice(-8).toUpperCase()}<br /><span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{new Date(o.createdAt).toLocaleDateString()}</span></td>
                        <td>{o.user?.name}<br /><span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{o.user?.email}</span></td>
                        <td>${o.total.toFixed(2)}</td>
                        <td><span className={`badge-status ${o.status}`}>{o.status}</span></td>
                        <td>
                          <select value={o.status} aria-label="Update order status" onChange={async (e) => {
                            try { await api.adminUpdateOrder(o._id, e.target.value, token); showToast('Order updated', 'success'); refreshOrders(); }
                            catch (err) { showToast(err.message, 'error'); }
                          }}>
                            {STATUSES.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {tab === 'customers' && (
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Joined</th></tr></thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c._id}><td>{c.name}</td><td>{c.email}</td><td>{new Date(c.createdAt).toLocaleDateString()}</td></tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'coupons' && (
            <>
              <form className="form" style={{ marginBottom: 24 }} onSubmit={async (e) => {
                e.preventDefault();
                try { await api.adminCreateCoupon(couponForm, token); showToast('Coupon created', 'success'); setCouponForm({ code: '', percent: 10, minOrder: 0 }); api.adminCoupons(token).then(setCoupons); }
                catch (err) { showToast(err.message, 'error'); }
              }}>
                <h3>New Coupon</h3>
                <div className="form-row">
                  <label>Code<input value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} required /></label>
                  <label>Percent off<input type="number" min="1" max="100" value={couponForm.percent} onChange={(e) => setCouponForm({ ...couponForm, percent: Number(e.target.value) })} required /></label>
                </div>
                <label>Minimum order ($)<input type="number" min="0" value={couponForm.minOrder} onChange={(e) => setCouponForm({ ...couponForm, minOrder: Number(e.target.value) })} /></label>
                <button className="btn" type="submit">Create Coupon</button>
              </form>
              <table className="table">
                <thead><tr><th>Code</th><th>Discount</th><th>Min Order</th><th>Active</th><th></th></tr></thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c._id}>
                      <td>{c.code}</td><td>{c.percent}%</td><td>${c.minOrder.toFixed(2)}</td>
                      <td><button className="btn-ghost" onClick={async () => { await api.adminUpdateCoupon(c._id, { percent: c.percent, active: !c.active, minOrder: c.minOrder }, token); api.adminCoupons(token).then(setCoupons); }}>{c.active ? 'Yes' : 'No'}</button></td>
                      <td><button className="btn-ghost" style={{ color: 'var(--danger)' }} onClick={async () => { if (window.confirm(`Delete coupon ${c.code}?`)) { await api.adminDeleteCoupon(c._id, token); api.adminCoupons(token).then(setCoupons); } }}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {tab === 'reviews' && (
            reviews.length === 0 ? <div className="empty"><h3>No reviews yet</h3><p>Reviews left by customers will appear here for moderation.</p></div> : (
              reviews.map((r) => (
                <div key={r._id} className="review-card">
                  <strong>{r.name}</strong> — {r.productName} — {'★'.repeat(r.rating)}
                  <p style={{ marginTop: 6 }}>{r.comment}</p>
                  <button className="btn-danger" onClick={async () => { if (window.confirm('Delete this review?')) { await api.adminDeleteReview(r.productId, r._id, token); setReviews(reviews.filter((x) => x._id !== r._id)); } }}>Delete Review</button>
                </div>
              ))
            )
          )}

          {tab === 'subscribers' && (
            subscribers.length === 0 ? <div className="empty"><h3>No subscribers yet</h3></div> : (
              <table className="table">
                <thead><tr><th>Email</th><th>Subscribed</th></tr></thead>
                <tbody>
                  {subscribers.map((s) => (
                    <tr key={s._id}><td>{s.email}</td><td>{new Date(s.createdAt).toLocaleDateString()}</td></tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
}
