import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { placeOrder } from '../services/api';
import { useToast } from '../components/Toast';

const METHODS = [
  {
    id:   'card',
    label: 'Credit / Debit Card',
    icon:  '💳',
    desc:  'Visa, Mastercard, Amex',
  },
  {
    id:   'cash',
    label: 'Cash on Delivery',
    icon:  '💵',
    desc:  'Pay cash when your order arrives',
  },
];

export default function CheckoutPage({ setCart }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { toast }       = useToast();

  const { items = [], source = 'menu' } = location.state || {};

  const [method, setMethod]   = useState('');
  const [step, setStep]       = useState(1);    // 1 = review + pick method, 2 = payment details, 3 = processing/done
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Card form state
  const [card, setCard]       = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [cardErr, setCardErr] = useState({});

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  // ── No items guard ────────────────────────────────────────────────────────
  if (!items.length) {
    return (
      <div style={{ padding: '64px 0' }}>
        <div className="container">
          <div className="empty-state">
            <span className="empty-icon">🛒</span>
            <h3>No items to checkout</h3>
            <button className="btn btn-accent" style={{ marginTop: 8 }} onClick={() => navigate('/menu')}>
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Card validation ───────────────────────────────────────────────────────
  const validateCard = () => {
    const e = {};
    if (!card.name.trim())                              e.name   = 'Cardholder name is required';
    if (!/^\d{16}$/.test(card.number.replace(/\s/g,''))) e.number = 'Enter a valid 16-digit card number';
    if (!/^\d{2}\/\d{2}$/.test(card.expiry))           e.expiry = 'Use MM/YY format';
    if (!/^\d{3,4}$/.test(card.cvv))                   e.cvv    = '3 or 4 digit CVV required';
    return e;
  };

  const formatCardNum = (v) =>
    v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();

  const formatExpiry = (v) => {
    const d = v.replace(/\D/g,'').slice(0,4);
    return d.length >= 3 ? d.slice(0,2) + '/' + d.slice(2) : d;
  };

  const setCardField = (key, val) => {
    setCard(p => ({ ...p, [key]: val }));
    setCardErr(p => ({ ...p, [key]: '' }));
  };

  // ── Place all orders ──────────────────────────────────────────────────────
  const handlePay = async () => {
    if (method === 'card') {
      const errs = validateCard();
      if (Object.keys(errs).length) { setCardErr(errs); return; }
    }

    setLoading(true);
    setStep(3);

    let successCount = 0;
    for (const item of items) {
      try {
        await placeOrder({ userId: user.id, itemId: item._id, quantity: item.qty }, token);
        successCount++;
      } catch {}
    }

    setLoading(false);

    if (successCount > 0) {
      setSuccess(true);
      if (source === 'cart') setCart([]);
      toast(
        successCount === items.length
          ? `Payment confirmed! ${successCount} order${successCount > 1 ? 's' : ''} placed.`
          : `${successCount}/${items.length} orders placed.`,
        'success'
      );
      setTimeout(() => navigate('/orders'), 2000);
    } else {
      toast('Payment failed. Please try again.', 'error');
      setStep(2);
    }
  };

  const foodEmoji = (cat) =>
    cat === 'drink' ? '🥤' : cat === 'dessert' ? '🍰' : cat === 'starter' ? '🥗' : '🍽️';

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3 — Processing / Success
  // ─────────────────────────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="animate-fade-up" style={{ textAlign: 'center', maxWidth: 360 }}>
          {loading ? (
            <>
              <div className="spinner spinner-lg" style={{ margin: '0 auto 24px' }} />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
                Processing payment…
              </h2>
              <p style={{ color: 'var(--ink-muted)', fontSize: 15 }}>
                Please wait while we confirm your order.
              </p>
            </>
          ) : success ? (
            <>
              <div style={{ fontSize: 72, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 10, color: 'var(--accent-3)' }}>
                Payment Confirmed!
              </h2>
              <p style={{ color: 'var(--ink-muted)', fontSize: 15, lineHeight: 1.6 }}>
                Your order has been placed successfully.<br />
                Redirecting to your orders…
              </p>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1 + 2 — Review & Payment
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '32px 0 64px' }}>
      <div className="container">

        {/* Breadcrumb + title */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, fontSize: 13, color: 'var(--ink-muted)' }}>
            <span
              style={{ cursor: step === 2 ? 'pointer' : 'default', fontWeight: step === 1 ? 600 : 400, color: step === 1 ? 'var(--ink)' : 'var(--ink-muted)' }}
              onClick={() => step === 2 && setStep(1)}
            >1. Review Order</span>
            <span>›</span>
            <span style={{ fontWeight: step === 2 ? 600 : 400, color: step === 2 ? 'var(--ink)' : 'var(--ink-muted)' }}>
              2. Payment Details
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em' }}>
            {step === 1 ? 'Review Your Order' : 'Enter Payment Details'}
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

          {/* ══ LEFT ══════════════════════════════════════════════════════════ */}
          <div>

            {/* ── STEP 1: items list + choose method ── */}
            {step === 1 && (
              <div className="animate-fade-in">

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                  {items.map(item => (
                    <div key={item._id} className="card">
                      <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                          width: 56, height: 56, borderRadius: 'var(--radius-md)', flexShrink: 0,
                          background: `hsl(${(item.name?.charCodeAt(0)||0)*7%360},25%,92%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                        }}>
                          {foodEmoji(item.category)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 3 }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                            ${Number(item.price).toFixed(2)} × {item.qty}
                            {item.category && <span className="tag" style={{ marginLeft: 8 }}>{item.category}</span>}
                          </div>
                        </div>
                        <span className="price" style={{ fontSize: 18 }}>
                          ${(item.price * item.qty).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Choose payment method */}
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, marginBottom: 14 }}>
                  Choose Payment Method
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                  {METHODS.map(m => (
                    <div
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      style={{
                        padding: '16px 20px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                        border: `2px solid ${method === m.id ? 'var(--ink)' : 'var(--border)'}`,
                        background: method === m.id ? 'var(--surface-2)' : 'var(--surface)',
                        transition: 'all var(--transition)',
                        display: 'flex', alignItems: 'center', gap: 16,
                      }}
                    >
                      <span style={{ fontSize: 32, flexShrink: 0 }}>{m.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)', marginBottom: 2 }}>{m.label}</div>
                        <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{m.desc}</div>
                      </div>
                      {/* Radio circle */}
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${method === m.id ? 'var(--ink)' : 'var(--border-dark)'}`,
                        background: method === m.id ? 'var(--ink)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {method === m.id && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className="btn btn-accent btn-lg"
                  disabled={!method}
                  onClick={() => method === 'cash' ? handlePay() : setStep(2)}
                  style={{ minWidth: 260 }}
                >
                  {!method
                    ? 'Select a payment method'
                    : method === 'cash'
                    ? `Confirm Order — $${total.toFixed(2)}`
                    : `Continue to Card Details →`}
                </button>

                {method === 'cash' && (
                  <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 10 }}>
                    💡 Your order will be confirmed immediately. Pay cash on delivery.
                  </p>
                )}
              </div>
            )}

            {/* ── STEP 2: Card details ── */}
            {step === 2 && (
              <div className="animate-fade-in">
                <button className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }} onClick={() => setStep(1)}>
                  ← Back
                </button>

                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-body" style={{ padding: 28 }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                      <span style={{ fontSize: 28 }}>💳</span>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>Card Details</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                      {/* Cardholder name */}
                      <div className="form-group">
                        <label className="form-label">Cardholder Name</label>
                        <input
                          type="text"
                          className={`form-input ${cardErr.name ? 'error' : ''}`}
                          placeholder="Alice Smith"
                          value={card.name}
                          onChange={e => setCardField('name', e.target.value)}
                        />
                        {cardErr.name && <span style={{ fontSize: 12, color: 'var(--accent)' }}>{cardErr.name}</span>}
                      </div>

                      {/* Card number */}
                      <div className="form-group">
                        <label className="form-label">Card Number</label>
                        <input
                          type="text"
                          className={`form-input ${cardErr.number ? 'error' : ''}`}
                          placeholder="1234 5678 9012 3456"
                          value={card.number}
                          onChange={e => setCardField('number', formatCardNum(e.target.value))}
                        />
                        {cardErr.number && <span style={{ fontSize: 12, color: 'var(--accent)' }}>{cardErr.number}</span>}
                      </div>

                      {/* Expiry + CVV */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div className="form-group">
                          <label className="form-label">Expiry Date</label>
                          <input
                            type="text"
                            className={`form-input ${cardErr.expiry ? 'error' : ''}`}
                            placeholder="MM/YY"
                            maxLength={5}
                            value={card.expiry}
                            onChange={e => setCardField('expiry', formatExpiry(e.target.value))}
                          />
                          {cardErr.expiry && <span style={{ fontSize: 12, color: 'var(--accent)' }}>{cardErr.expiry}</span>}
                        </div>
                        <div className="form-group">
                          <label className="form-label">CVV</label>
                          <input
                            type="password"
                            className={`form-input ${cardErr.cvv ? 'error' : ''}`}
                            placeholder="•••"
                            maxLength={4}
                            value={card.cvv}
                            onChange={e => setCardField('cvv', e.target.value.replace(/\D/g,'').slice(0,4))}
                          />
                          {cardErr.cvv && <span style={{ fontSize: 12, color: 'var(--accent)' }}>{cardErr.cvv}</span>}
                        </div>
                      </div>

                      {/* Accepted card logos */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        {['VISA', 'MC', 'AMEX'].map(c => (
                          <span key={c} style={{
                            padding: '4px 12px', borderRadius: 6,
                            border: '1px solid var(--border)',
                            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                            color: 'var(--ink-soft)', background: 'var(--surface-2)',
                          }}>{c}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pay button */}
                <button
                  className="btn btn-accent btn-full btn-lg"
                  onClick={handlePay}
                  disabled={loading}
                  style={{ fontSize: 17, letterSpacing: '0.01em' }}
                >
                  {loading
                    ? <><span className="spinner spinner-sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Processing…</>
                    : `Pay $${total.toFixed(2)} Now 🔒`}
                </button>

                <p style={{ fontSize: 12, color: 'var(--ink-muted)', textAlign: 'center', marginTop: 10 }}>
                  🔒 Your payment information is secure and encrypted
                </p>
              </div>
            )}

          </div>

          {/* ══ RIGHT — Always-visible order summary ═════════════════════════ */}
          <div className="card" style={{ position: 'sticky', top: 80 }}>
            <div className="card-body" style={{ padding: 22 }}>

              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
                Order Summary
              </h3>

              {items.map(item => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14, gap: 8 }}>
                  <span style={{ color: 'var(--ink-soft)', flex: 1 }}>
                    {item.name}
                    <span style={{ color: 'var(--ink-muted)', marginLeft: 4 }}>×{item.qty}</span>
                  </span>
                  <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                    ${(item.price * item.qty).toFixed(2)}
                  </span>
                </div>
              ))}

              <div className="divider" />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Delivery</span>
                <span className="badge badge-green" style={{ fontSize: 11 }}>FREE</span>
              </div>

              <div className="divider" />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>Total</span>
                <span className="price" style={{ fontSize: 24 }}>${total.toFixed(2)}</span>
              </div>

              {/* Selected method badge */}
              {method && (
                <div style={{
                  padding: '10px 14px', background: 'var(--surface-2)',
                  borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 8,
                  border: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 18 }}>{METHODS.find(m => m.id === method)?.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-soft)' }}>
                    {METHODS.find(m => m.id === method)?.label}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
