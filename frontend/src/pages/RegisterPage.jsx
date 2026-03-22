import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser, loginUser } from '../services/api';
import { useToast } from '../components/Toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'At least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await registerUser({ name: form.name, email: form.email, password: form.password });
      const { data } = await loginUser({ email: form.email, password: form.password });
      login({ name: data.name, id: data.userId }, data.token);
      toast('Account created! Welcome, ' + form.name + '!', 'success');
      navigate('/menu');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      toast(msg, 'error');
      if (msg.toLowerCase().includes('email')) setErrors({ email: msg });
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => {
    setForm(p => ({ ...p, [key]: e.target.value }));
    setErrors(p => ({ ...p, [key]: '' }));
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div className="animate-fade-up" style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, background: 'var(--accent)', borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, margin: '0 auto 16px', fontFamily: 'var(--font-display)', fontWeight: 800, color: '#fff',
          }}>🍽</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Create account
          </h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: 14, marginTop: 6 }}>
            Start ordering in seconds
          </p>
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: 32 }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { key: 'name', label: 'Full name', type: 'text', placeholder: 'Alice Smith' },
                { key: 'email', label: 'Email', type: 'email', placeholder: 'alice@example.com' },
                { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
                { key: 'confirm', label: 'Confirm password', type: 'password', placeholder: '••••••••' },
              ].map(({ key, label, type, placeholder }) => (
                <div className="form-group" key={key}>
                  <label className="form-label">{label}</label>
                  <input
                    type={type} className={`form-input ${errors[key] ? 'error' : ''}`}
                    placeholder={placeholder} value={form[key]} onChange={set(key)}
                  />
                  {errors[key] && <span style={{ fontSize: 12, color: 'var(--accent)' }}>{errors[key]}</span>}
                </div>
              ))}

              <button type="submit" className="btn btn-accent btn-full btn-lg" disabled={loading} style={{ marginTop: 4 }}>
                {loading ? <><span className="spinner spinner-sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Creating account…</> : 'Create account →'}
              </button>
            </form>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--ink-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--ink)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
