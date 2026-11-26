import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext.jsx';

function AuthForm({ mode }) {
  const { login, register, showToast } = useShop();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      if (mode === 'register') await register(name, email, password);
      else await login(email, password);
      showToast(mode === 'register' ? 'Welcome to Vera!' : 'Welcome back!', 'success');
      navigate('/');
    } catch (err) { setError(err.message); }
    setBusy(false);
  };

  return (
    <div className="container page" style={{ maxWidth: 520 }}>
      <h1 className="page-title">{mode === 'register' ? 'Create account' : 'Welcome back'}</h1>
      <p className="page-sub">{mode === 'register' ? 'Join Vera — it takes a minute.' : 'Sign in to your account.'}</p>
      <form className="form" onSubmit={submit}>
        {error && <p className="error">{error}</p>}
        {mode === 'register' && <label>Full Name<input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} /></label>}
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Min. 6 characters" /></label>
        <button className="btn" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'register' ? 'Create Account' : 'Sign In'}</button>
      </form>
      <p style={{ marginTop: 16 }}>
        {mode === 'register'
          ? <>Already have an account? <Link className="link" to="/login">Sign in</Link></>
          : <>New to Vera? <Link className="link" to="/register">Create account</Link></>}
      </p>
    </div>
  );
}

export const Login = () => <AuthForm mode="login" />;
export const Register = () => <AuthForm mode="register" />;
