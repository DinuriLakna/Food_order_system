import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/api';
import { useToast } from '../components/Toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const { data } = await loginUser(form);
      login({ name: data.name, id: data.userId }, data.token);
      toast('Welcome back, ' + data.name + '!', 'success');
      navigate('/menu');
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid email or password';
      toast(msg, 'error');
      setErrors({ password: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div className="animate-fade-up" style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, background: 'var(--ink)', borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, margin: '0 auto 16px', fontFamily: 'var(--font-display)', fontWeight: 800, color: '#fff',
          }}>F</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Sign in
          </h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: 14, marginTop: 6 }}>
            Welcome back to FoodOrder
          </p>
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: 32 }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email" className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="you@example.com" value={form.email}
                  onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: '' })); }}
                />
                {errors.email && <span style={{ fontSize: 12, color: 'var(--accent)' }}>{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password" className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="••••••••" value={form.password}
                  onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })); }}
                />
                {errors.password && <span style={{ fontSize: 12, color: 'var(--accent)' }}>{errors.password}</span>}
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 4 }}>
                {loading ? <><span className="spinner spinner-sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Signing in…</> : 'Sign in →'}
              </button>
            </form>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--ink-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--ink)', fontWeight: 600, textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
