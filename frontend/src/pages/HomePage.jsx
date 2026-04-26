import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkHealth } from '../services/api';

export default function HomePage() {
  const { isLoggedIn } = useAuth();
  const [services, setServices] = useState([]);

  useEffect(() => {
    checkHealth().then(setServices).catch(() => {});
  }, []);

  const features = [
    { icon: '🍕', title: 'Fresh Menu', desc: 'Browse our carefully curated selection of dishes, updated daily by our chefs.' },
    { icon: '⚡', title: 'Fast Orders', desc: 'Place orders in seconds. Real-time confirmation with live status tracking.' },
    { icon: '💳', title: 'Easy Payments', desc: 'Secure, instant payment processing. Full history always available.' },
    { icon: '📦', title: 'Order History', desc: 'All your past orders and receipts in one place, forever.' },
  ];

  return (
    <div>
      {/* Hero */}
      <section style={{
        padding: '80px 0 100px', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, var(--ink) 0%, #2A1F1A 100%)',
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', top: -80, right: -80, width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(232,71,10,0.25) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: '30%', width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(245,166,35,0.15) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
          <div className="animate-fade-up" style={{ animationDelay: '0s' }}>
            <span style={{
              display: 'inline-block', padding: '6px 16px', borderRadius: 100,
              border: '1px solid rgba(232,71,10,0.4)', color: 'rgba(245,166,35,0.9)',
              fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              marginBottom: 24,
            }}>
              Now Open — Order Online....
            </span>
          </div>

          <h1 className="animate-fade-up" style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 'clamp(40px, 8vw, 80px)', lineHeight: 1.05,
            letterSpacing: '-0.03em', color: '#fff', marginBottom: 24,
            animationDelay: '0.1s',
          }}>
            Great food<br />
            <span style={{ color: 'var(--accent)' }}>delivered fast.</span>
          </h1>

          

          <div className="animate-fade-up" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', animationDelay: '0.3s' }}>
            <Link to="/menu">
              <button className="btn btn-accent btn-lg">Browse Menu →</button>
            </Link>
            {!isLoggedIn && (
              <Link to="/register">
                <button className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.2)' }}>
                  Create account
                </button>
              </Link>
            )}
          </div>

          
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Everything you need
            </h2>
            <p style={{ color: 'var(--ink-muted)', marginTop: 8, fontSize: 15 }}>Built on 4 independent microservices, seamlessly integrated.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 20 }}>
            {features.map((f, i) => (
              <div key={f.title} className="card animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="card-body">
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ color: 'var(--ink-muted)', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--ink-soft)' }}>FoodOrder</span>
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>SLIIT SE4010</span>
        </div>
      </footer>
    </div>
  );
}
