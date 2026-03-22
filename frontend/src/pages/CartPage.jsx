import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CartPage({ cart, setCart }) {
  const { isLoggedIn } = useAuth();
  const navigate       = useNavigate();

  const updateQty = (id, delta) =>
    setCart(prev =>
      prev.map(c => c._id === id ? { ...c, qty: c.qty + delta } : c)
          .filter(c => c.qty > 0)
    );

  const remove = (id) => setCart(prev => prev.filter(c => c._id !== id));

  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  const goToCheckout = () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    navigate('/checkout', {
      state: {
        items:  cart,
        source: 'cart',
      },
    });
  };

  if (cart.length === 0) {
    return (
      <div style={{ padding: '64px 0' }}>
        <div className="container">
          <div className="empty-state">
            <span className="empty-icon">🛒</span>
            <h3>Your cart is empty</h3>
            <p>Browse the menu and add some delicious items</p>
            <Link to="/menu">
              <button className="btn btn-accent" style={{ marginTop: 8 }}>Browse Menu</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const foodEmoji = (cat) =>
    cat === 'drink' ? '🥤' : cat === 'dessert' ? '🍰' : cat === 'starter' ? '🥗' : '🍽️';

  return (
    <div style={{ padding: '32px 0 64px' }}>
      <div className="container">

        <div className="page-header">
          <h1>Your Cart</h1>
          <p>{cart.length} item type{cart.length !== 1 ? 's' : ''}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

          {/* ── Item list ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cart.map(item => (
              <div key={item._id} className="card animate-slide-in">
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

                  {/* Emoji thumbnail */}
                  <div style={{
                    width: 64, height: 64, borderRadius: 'var(--radius-md)', flexShrink: 0,
                    background: `hsl(${(item.name?.charCodeAt(0)||0)*7%360},25%,92%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                  }}>
                    {foodEmoji(item.category)}
                  </div>

                  {/* Name + price */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 3 }}>
                      {item.name}
                    </h3>
                    <span className="price" style={{ fontSize: 14 }}>${Number(item.price).toFixed(2)}</span>
                    <span style={{ color: 'var(--ink-muted)', fontSize: 13 }}> each</span>
                    {item.category && (
                      <span className="tag" style={{ marginLeft: 8 }}>{item.category}</span>
                    )}
                  </div>

                  {/* Qty controls */}
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    border: '1.5px solid var(--border-dark)', borderRadius: 8, overflow: 'hidden',
                  }}>
                    <button
                      style={{ width: 34, height: 34, border: 'none', background: 'var(--surface-2)', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}
                      onClick={() => updateQty(item._id, -1)}
                    >−</button>
                    <span style={{
                      width: 38, textAlign: 'center',
                      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
                      borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)',
                      lineHeight: '34px',
                    }}>{item.qty}</span>
                    <button
                      style={{ width: 34, height: 34, border: 'none', background: 'var(--surface-2)', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}
                      onClick={() => updateQty(item._id, +1)}
                    >+</button>
                  </div>

                  {/* Line total */}
                  <span className="price" style={{ fontSize: 16, minWidth: 68, textAlign: 'right' }}>
                    ${(item.price * item.qty).toFixed(2)}
                  </span>

                  {/* Remove */}
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => remove(item._id)}
                    style={{ color: 'var(--ink-muted)', padding: '4px 8px', fontSize: 16 }}
                  >✕</button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Summary sidebar ── */}
          <div className="card" style={{ position: 'sticky', top: 80 }}>
            <div className="card-body" style={{ padding: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 20 }}>
                Order Summary
              </h2>

              {cart.map(item => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
                  <span style={{ color: 'var(--ink-soft)' }}>{item.name} × {item.qty}</span>
                  <span style={{ fontWeight: 500 }}>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}

              <div className="divider" />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Delivery</span>
                <span className="badge badge-green" style={{ fontSize: 11 }}>FREE</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Total</span>
                <span className="price" style={{ fontSize: 24 }}>${total.toFixed(2)}</span>
              </div>

              {/* ── Checkout button → redirects to payment ── */}
              <button
                className="btn btn-accent btn-full btn-lg"
                onClick={goToCheckout}
              >
                Proceed to Payment →
              </button>

              <Link to="/menu">
                <button className="btn btn-ghost btn-full" style={{ marginTop: 8 }}>
                  ← Continue shopping
                </button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
