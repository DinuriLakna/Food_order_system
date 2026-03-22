import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMenuItems } from '../services/api';
import { useToast } from '../components/Toast';

const CATEGORIES = ['all', 'main', 'starter', 'dessert', 'drink', 'other'];

export default function MenuPage({ cart, setCart }) {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [popup, setPopup]       = useState(null);  // item object or null
  const [popupQty, setPopupQty] = useState(1);

  const { isLoggedIn } = useAuth();
  const { toast }      = useToast();
  const navigate       = useNavigate();

  useEffect(() => {
    getMenuItems()
      .then(r => setItems(r.data))
      .catch(() => toast('Could not load menu', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(item => {
    const matchCat    = filter === 'all' || item.category === filter;
    const matchSearch = item.name?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch && item.available !== false;
  });

  // ── Cart helpers ──────────────────────────────────────────────────────────
  const getCartQty = (id) => cart.find(c => c._id === id)?.qty || 0;

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c._id === item._id);
      if (existing) return prev.map(c => c._id === item._id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
    toast(`${item.name} added to cart`, 'success');
  };

  // ── Open popup ────────────────────────────────────────────────────────────
  const openOrderPopup = (item) => {
    if (!isLoggedIn) {
      toast('Please sign in to place an order', 'warning');
      navigate('/login');
      return;
    }
    setPopupQty(1);
    setPopup(item);
  };

  // ── Confirm from popup → navigate to checkout ─────────────────────────────
  const confirmPopupOrder = () => {
    navigate('/checkout', {
      state: {
        items:  [{ ...popup, qty: popupQty }],
        source: 'menu',
      },
    });
    setPopup(null);
  };

  const categoryLabel = (c) =>
    c === 'all' ? 'All Items' : c.charAt(0).toUpperCase() + c.slice(1);

  const foodEmoji = (cat) =>
    cat === 'drink' ? '🥤' : cat === 'dessert' ? '🍰' : cat === 'starter' ? '🥗' : '🍽️';

  return (
    <div style={{ padding: '32px 0 64px' }}>
      <div className="container">

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,5vw,40px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>
            Our Menu
          </h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: 15 }}>
            {items.length} items available today
          </p>
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }}>🔍</span>
            <input
              type="text" className="form-input" placeholder="Search dishes…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 38 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setFilter(c)}
                className={`btn btn-sm ${filter === c ? 'btn-primary' : 'btn-outline'}`}>
                {categoryLabel(c)}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px,1fr))', gap: 20 }}>
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="card">
                <div className="skeleton" style={{ height: 160 }} />
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="skeleton" style={{ height: 20, width: '70%' }} />
                  <div className="skeleton" style={{ height: 14, width: '90%' }} />
                  <div className="skeleton" style={{ height: 36, marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🍽️</span>
            <h3>Nothing found</h3>
            <p>Try a different search term or category</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px,1fr))', gap: 20 }}>
            {filtered.map((item, i) => (
              <div key={item._id} className="card animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                {/* Banner */}
                <div style={{
                  height: 150,
                  background: `hsl(${(item.name?.charCodeAt(0) || 0) * 7 % 360}, 25%, 92%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 52, position: 'relative',
                }}>
                  {foodEmoji(item.category)}
                  {getCartQty(item._id) > 0 && (
                    <span style={{
                      position: 'absolute', top: 10, right: 10,
                      background: 'var(--accent)', color: '#fff', borderRadius: '50%',
                      width: 24, height: 24, fontSize: 11, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{getCartQty(item._id)}</span>
                  )}
                  {item.category && (
                    <span style={{
                      position: 'absolute', bottom: 10, left: 10,
                      background: 'rgba(0,0,0,0.55)', color: '#fff',
                      padding: '2px 10px', borderRadius: 100,
                      fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
                    }}>{item.category}</span>
                  )}
                </div>

                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, lineHeight: 1.3, flex: 1, marginRight: 8 }}>
                      {item.name}
                    </h3>
                    <span className="price" style={{ fontSize: 18, whiteSpace: 'nowrap' }}>
                      ${Number(item.price).toFixed(2)}
                    </span>
                  </div>

                  {item.description && (
                    <p style={{
                      fontSize: 13, color: 'var(--ink-muted)', marginBottom: 14, lineHeight: 1.55,
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {item.description}
                    </p>
                  )}

                  <div className="divider" style={{ margin: '10px 0' }} />

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => addToCart(item)}>
                      🛒 Add to Cart
                    </button>
                    <button className="btn btn-accent btn-sm" style={{ flex: 1 }} onClick={() => openOrderPopup(item)}>
                      Order Now →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════
          QUANTITY POPUP MODAL
      ════════════════════════════════════════════════════════════ */}
      {popup && (
        <div className="modal-overlay" onClick={() => setPopup(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>

            {/* Header */}
            <div className="modal-header">
              <h2 style={{ fontSize: 18 }}>{popup.name}</h2>
              <button
                onClick={() => setPopup(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--ink-muted)', lineHeight: 1, padding: 4 }}
              >✕</button>
            </div>

            {/* Body */}
            <div className="modal-body">

              {/* Food emoji preview */}
              <div style={{
                height: 110, borderRadius: 'var(--radius-md)', marginBottom: 18,
                background: `hsl(${(popup.name?.charCodeAt(0)||0)*7%360},25%,92%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52,
              }}>
                {foodEmoji(popup.category)}
              </div>

              {/* Description */}
              {popup.description && (
                <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginBottom: 18, lineHeight: 1.6 }}>
                  {popup.description}
                </p>
              )}

              {/* Unit price */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <span style={{ fontSize: 14, color: 'var(--ink-muted)' }}>Unit price</span>
                <span className="price" style={{ fontSize: 20 }}>${Number(popup.price).toFixed(2)}</span>
              </div>

              {/* Quantity picker */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-soft)' }}>Quantity</span>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  border: '2px solid var(--border-dark)', borderRadius: 10, overflow: 'hidden',
                }}>
                  <button
                    onClick={() => setPopupQty(q => Math.max(1, q - 1))}
                    style={{ width: 44, height: 44, border: 'none', background: 'var(--surface-2)', cursor: 'pointer', fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}
                  >−</button>
                  <span style={{
                    width: 56, textAlign: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20,
                    borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)',
                    lineHeight: '44px',
                  }}>{popupQty}</span>
                  <button
                    onClick={() => setPopupQty(q => q + 1)}
                    style={{ width: 44, height: 44, border: 'none', background: 'var(--surface-2)', cursor: 'pointer', fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}
                  >+</button>
                </div>
              </div>

              {/* Order total */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 18px', background: 'var(--surface-2)',
                borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)',
              }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>Total</span>
                <span className="price" style={{ fontSize: 26 }}>
                  ${(popup.price * popupQty).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setPopup(null)}>Cancel</button>
              <button className="btn btn-accent btn-lg" onClick={confirmPopupOrder} style={{ minWidth: 190 }}>
                Proceed to Payment →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
