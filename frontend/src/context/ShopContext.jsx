import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';

const ShopContext = createContext(null);
export const useShop = () => useContext(ShopContext);

// Auth + cart + wishlist, shared by every page.
// Cart lives in localStorage (it is a device cart). Wishlist lives on
// the account in the backend, so it follows the user across devices.
export function ShopProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vera_user') || 'null'); } catch { return null; }
  });
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vera_cart') || '[]'); } catch { return []; }
  });
  const [wishlist, setWishlist] = useState([]); // product objects from the backend
  const [toast, setToast] = useState(null);

  const token = user?.token || null;

  useEffect(() => { localStorage.setItem('vera_cart', JSON.stringify(cart)); }, [cart]);

  // Load the account wishlist when the user logs in.
  useEffect(() => {
    if (!token) { setWishlist([]); return; }
    api.getWishlist(token).then(setWishlist).catch(() => setWishlist([]));
  }, [token]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const saveUser = (data) => {
    setUser(data);
    localStorage.setItem('vera_user', JSON.stringify(data));
  };

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    saveUser(data);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await api.register({ name, email, password });
    saveUser(data);
    return data;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vera_user');
    setWishlist([]);
  };

  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const found = prev.find((i) => i.id === product._id);
      if (found) return prev.map((i) => (i.id === product._id ? { ...i, quantity: Math.min(product.stock, i.quantity + qty) } : i));
      return [...prev, { id: product._id, name: product.name, price: product.price, image: product.image, stock: product.stock, quantity: Math.min(product.stock, qty) }];
    });
    showToast(`${product.name} added to cart`, 'success');
  };

  const updateQty = (id, delta) => setCart((prev) => prev
    .map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Math.min(i.stock, i.quantity + delta)) } : i))
    .filter((i) => i.quantity > 0));

  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i.id !== id));
  const clearCart = () => setCart([]);

  const isWishlisted = (id) => wishlist.some((p) => p._id === id);

  const toggleWishlist = async (product) => {
    if (!token) { showToast('Sign in to save items to your wishlist', 'error'); return false; }
    const data = await api.toggleWishlist(product._id, token);
    if (data.saved) {
      setWishlist((prev) => [...prev, product]);
      showToast('Added to wishlist', 'success');
    } else {
      setWishlist((prev) => prev.filter((p) => p._id !== product._id));
      showToast('Removed from wishlist', 'info');
    }
    return data.saved;
  };

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const value = useMemo(() => ({
    user, token, login, register, logout,
    cart, cartCount, cartSubtotal, addToCart, updateQty, removeFromCart, clearCart,
    wishlist, isWishlisted, toggleWishlist,
    toast, showToast,
  }), [user, cart, wishlist, toast]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}
