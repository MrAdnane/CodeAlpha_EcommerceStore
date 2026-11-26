import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useShop } from '../context/ShopContext.jsx';

export default function Profile() {
  const { user, token, logout, showToast } = useShop();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState(user?.address || { street: '', city: '', state: '', zip: '', country: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  if (!user) return <div className="container page"><div className="empty"><h3>Sign in to see your profile</h3><button className="btn" style={{ marginTop: 16 }} onClick={() => navigate('/login')}>Sign In</button></div></div>;

  const saveProfile = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const data = await api.updateProfile({ name, email, address }, token);
      // Keep the token, update the stored user.
      const updated = { ...data, token: user.token };
      localStorage.setItem('vera_user', JSON.stringify(updated));
      window.location.reload();
    } catch (err) { setMsg(err.message); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg('');
    try {
      await api.updatePassword({ currentPassword, newPassword }, token);
      setPwMsg('Password updated.');
      setCurrentPassword(''); setNewPassword('');
    } catch (err) { setPwMsg(err.message); }
  };

  return (
    <div className="container page">
      <h1 className="page-title">Profile</h1>
      <p className="page-sub">Signed in as {user.email} · {user.role}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }} className="profile-grid">
        <form className="form" onSubmit={saveProfile}>
          <h2>Personal details &amp; address</h2>
          {msg && <p className="error">{msg}</p>}
          <label>Full Name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Street<input value={address.street || ''} onChange={(e) => setAddress({ ...address, street: e.target.value })} /></label>
          <div className="form-row">
            <label>City<input value={address.city || ''} onChange={(e) => setAddress({ ...address, city: e.target.value })} /></label>
            <label>State<input value={address.state || ''} onChange={(e) => setAddress({ ...address, state: e.target.value })} /></label>
          </div>
          <div className="form-row">
            <label>ZIP<input value={address.zip || ''} onChange={(e) => setAddress({ ...address, zip: e.target.value })} /></label>
            <label>Country<input value={address.country || ''} onChange={(e) => setAddress({ ...address, country: e.target.value })} /></label>
          </div>
          <button className="btn" type="submit">Save Profile</button>
          <button className="btn-outline" type="button" onClick={() => navigate('/orders')}>View My Orders</button>
        </form>
        <form className="form" onSubmit={changePassword}>
          <h2>Change password</h2>
          {pwMsg && <p>{pwMsg}</p>}
          <label>Current Password<input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></label>
          <label>New Password<input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} /></label>
          <button className="btn" type="submit">Update Password</button>
          <button className="btn-danger" type="button" onClick={() => { logout(); navigate('/'); }}>Sign Out</button>
        </form>
      </div>
    </div>
  );
}
