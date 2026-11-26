// One place for all API calls.
// In dev, VITE_API_URL is empty and Vite proxies /api to localhost:5000.
// In production, set VITE_API_URL to the deployed API (no trailing slash).
const BASE = import.meta.env.VITE_API_URL || '';

export const apiUrl = BASE;

async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  // 204 No Content has no body to parse.
  const data = res.status === 204 ? null : await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Something went wrong');
  return data;
}

export const api = {
  getProducts: (params = '') => request(`/api/products${params}`),
  getProduct: (id) => request(`/api/products/${id}`),
  register: (body) => request('/api/auth/register', { method: 'POST', body }),
  login: (body) => request('/api/auth/login', { method: 'POST', body }),
  getProfile: (token) => request('/api/auth/profile', { token }),
  updateProfile: (body, token) => request('/api/auth/profile', { method: 'PUT', body, token }),
  updatePassword: (body, token) => request('/api/auth/password', { method: 'PUT', body, token }),
  getWishlist: (token) => request('/api/auth/wishlist', { token }),
  toggleWishlist: (productId, token) => request('/api/auth/wishlist', { method: 'PUT', body: { productId }, token }),
  createOrder: (body, token) => request('/api/orders', { method: 'POST', body, token }),
  getMyOrders: (token) => request('/api/orders/my', { token }),
  getOrder: (id, token) => request(`/api/orders/${id}`, { token }),
  addReview: (id, body, token) => request(`/api/products/${id}/reviews`, { method: 'POST', body, token }),
  subscribe: (email) => request('/api/newsletter/subscribe', { method: 'POST', body: { email } }),
  validateCoupon: (code, subtotal) => request('/api/coupons/validate', { method: 'POST', body: { code, subtotal } }),
  // Admin
  adminStats: (token) => request('/api/admin/stats', { token }),
  adminOrders: (params, token) => request(`/api/orders${params}`, { token }),
  adminUpdateOrder: (id, status, token) => request(`/api/orders/${id}/status`, { method: 'PUT', body: { status }, token }),
  adminCustomers: (params, token) => request(`/api/admin/customers${params}`, { token }),
  adminCoupons: (token) => request('/api/admin/coupons', { token }),
  adminCreateCoupon: (body, token) => request('/api/admin/coupons', { method: 'POST', body, token }),
  adminUpdateCoupon: (id, body, token) => request(`/api/admin/coupons/${id}`, { method: 'PUT', body, token }),
  adminDeleteCoupon: (id, token) => request(`/api/admin/coupons/${id}`, { method: 'DELETE', token }),
  adminReviews: (token) => request('/api/admin/reviews', { token }),
  adminDeleteReview: (productId, reviewId, token) => request(`/api/admin/products/${productId}/reviews/${reviewId}`, { method: 'DELETE', token }),
  adminSubscribers: (token) => request('/api/admin/subscribers', { token }),
  adminCreateProduct: (body, token) => request('/api/products', { method: 'POST', body, token }),
  adminUpdateProduct: (id, body, token) => request(`/api/products/${id}`, { method: 'PUT', body, token }),
  adminDeleteProduct: (id, token) => request(`/api/products/${id}`, { method: 'DELETE', token }),
};
