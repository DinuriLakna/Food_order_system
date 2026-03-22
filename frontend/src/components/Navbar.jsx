import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ cartCount = 0 }) {
  const { isLoggedIn, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: scrolled ? 'rgba(250,250,247,0.95)' : 'var(--paper)',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
      transition: 'all 0.3s ease',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64, gap: 8 }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, marginRight: 24 }}>
          <div style={{
            width: 36, height: 36, background: 'var(--accent)', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)',
            flexShrink: 0,
          }}>F</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            FoodOrder
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
          {[
            { to: '/menu', label: 'Menu' },
            ...(isLoggedIn ? [
              { to: '/orders', label: 'My Orders' },
              { to: '/payments', label: 'Payments' },
            ] : []),
          ].map(({ to, label }) => (
            <Link key={to} to={to} style={{
              padding: '6px 14px', borderRadius: 'var(--radius-sm)',
              fontWeight: 500, fontSize: 14, textDecoration: 'none',
              color: isActive(to) ? 'var(--ink)' : 'var(--ink-muted)',
              background: isActive(to) ? 'var(--surface-2)' : 'transparent',
              transition: 'all var(--transition)',
            }}
            onMouseEnter={e => { if (!isActive(to)) e.target.style.color = 'var(--ink)'; }}
            onMouseLeave={e => { if (!isActive(to)) e.target.style.color = 'var(--ink-muted)'; }}
            >{label}</Link>
          ))}
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          {isLoggedIn ? (
            <>
              <Link to="/cart" style={{ position: 'relative', textDecoration: 'none' }}>
                <button className="btn btn-ghost btn-sm" style={{ position: 'relative' }}>
                  🛒
                  {cartCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -4, right: -4,
                      background: 'var(--accent)', color: '#fff',
                      borderRadius: '50%', width: 18, height: 18,
                      fontSize: 10, fontWeight: 700, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>{cartCount}</span>
                  )}
                </button>
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--ink)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)',
                  flexShrink: 0,
                }}>
                  {(user?.name || 'U')[0].toUpperCase()}
                </div>
                <span className="hide-mobile" style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-soft)' }}>
                  {user?.name?.split(' ')[0]}
                </span>
              </div>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login"><button className="btn btn-ghost btn-sm">Sign in</button></Link>
              <Link to="/register"><button className="btn btn-primary btn-sm">Get started</button></Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
