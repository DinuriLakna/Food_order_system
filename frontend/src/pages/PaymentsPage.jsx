import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPayments, getOrders } from '../services/api';
import { useToast } from '../components/Toast';

export default function PaymentsPage() {
  const [payments, setPayments]           = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loadingP, setLoadingP]           = useState(true);
  const [loadingO, setLoadingO]           = useState(true);
  const { token }  = useAuth();
  const { toast }  = useToast();
  const navigate   = useNavigate();

  // ── Fetch payment history ─────────────────────────────────────────────────
  useEffect(() => {
    getPayments(token)
      .then(r => setPayments(r.data.reverse()))
      .catch(() => toast('Could not load payments', 'error'))
      .finally(() => setLoadingP(false));
  }, [token]);

  // ── Fetch orders, keep only those with status CREATED (no payment yet) ───
  useEffect(() => {
    getOrders(token)
      .then(r => {
        const pending = r.data
          .filter(o => o.status === 'CREATED')
          .reverse();
        setPendingOrders(pending);
      })
      .catch(() => {})
      .finally(() => setLoadingO(false));
  }, [token]);

  const totalSpent = payments
    .filter(p => p.status === 'PAID')
    .reduce((s, p) => s + (p.amount || 0), 0);

  // ── Pay Now → go to checkout page with order details ─────────────────────
  const handlePayNow = (order) => {
    navigate('/checkout', {
      state: {
        items: [{
          _id:      order.itemId,
          name:     order.itemName || 'Food Item',
          price:    order.totalPrice || 0,
          qty:      order.quantity  || 1,
          category: order.category  || '',
        }],
        source: 'payment-page',
      },
    });
  };

  return (
    <div style={{ padding: '32px 0 64px' }}>
      <div className="container">

        <div className="page-header">
          <h1>Payments</h1>
          <p>Manage pending payments and view your transaction history</p>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 1 — PENDING PAYMENTS  (main focus)
        ══════════════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>
              Pending Payment
            </h2>
            {pendingOrders.length > 0 && (
              <span style={{
                background: 'var(--accent)', color: '#fff', borderRadius: '50%',
                width: 26, height: 26, fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{pendingOrders.length}</span>
            )}
          </div>

          {loadingO ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2].map(i => (
                <div key={i} className="card">
                  <div className="card-body" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: 56, height: 56, borderRadius: 12, flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="skeleton" style={{ height: 16, width: '45%' }} />
                      <div className="skeleton" style={{ height: 13, width: '30%' }} />
                    </div>
                    <div className="skeleton" style={{ width: 110, height: 42, borderRadius: 8 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : pendingOrders.length === 0 ? (
            <div style={{
              padding: '28px 24px', borderRadius: 'var(--radius-md)',
              background: 'var(--surface-2)',
              border: '1.5px dashed var(--border-dark)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink-soft)' }}>No pending payments</div>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 4 }}>
                All your orders have been paid
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingOrders.map((order, i) => (
                <div
                  key={order._id}
                  className="card animate-fade-up"
                  style={{ border: '2px solid var(--accent-2)', animationDelay: `${i * 0.06}s` }}
                >
                  <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>

                    {/* Icon */}
                    <div style={{
                      width: 56, height: 56, borderRadius: 'var(--radius-md)', flexShrink: 0,
                      background: '#FEF3C7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                    }}>⏳</div>

                    {/* Order info */}
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                        {order.itemName || 'Food Item'}
                      </div>
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13, color: 'var(--ink-muted)' }}>
                        <span>Order #{order._id?.slice(-8).toUpperCase()}</span>
                        <span>Qty: {order.quantity || 1}</span>
                        {order.createdAt && (
                          <span>
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount + Pay Now */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      {order.totalPrice > 0 && (
                        <span className="price" style={{ fontSize: 22 }}>
                          ${Number(order.totalPrice).toFixed(2)}
                        </span>
                      )}
                      <button
                        className="btn btn-accent"
                        onClick={() => handlePayNow(order)}
                        style={{ minWidth: 110 }}
                      >
                        Pay Now →
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2 — SUMMARY STATS  (compact)
        ══════════════════════════════════════════════════════════════ */}
        {payments.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 12, color: 'var(--ink-soft)' }}>
              Summary
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 10 }}>
              {[
                { label: 'Total Spent',  value: `$${totalSpent.toFixed(2)}`,                                icon: '💰', color: 'var(--accent-3)' },
                { label: 'Transactions', value: payments.length,                                             icon: '📋', color: 'var(--accent)' },
                { label: 'Successful',   value: payments.filter(p => p.status === 'PAID').length,            icon: '✅', color: 'var(--accent-3)' },
                { label: 'Failed',       value: payments.filter(p => p.status === 'FAILED').length,          icon: '❌', color: '#DC2626' },
              ].map(s => (
                <div key={s.label} style={{
                  padding: '12px 14px', borderRadius: 'var(--radius-md)',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {s.label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: s.color, letterSpacing: '-0.02em' }}>
                      {s.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 3 — PAYMENT HISTORY  (compact rows)
        ══════════════════════════════════════════════════════════════ */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 12, color: 'var(--ink-soft)' }}>
            Transaction History
          </h2>

          {loadingP ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <div className="spinner" />
            </div>
          ) : payments.length === 0 ? (
            <div className="empty-state" style={{ padding: '28px 0' }}>
              <span style={{ fontSize: 32 }}>💳</span>
              <h3>No transactions yet</h3>
              <p>Payment history appears here after you complete orders</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {payments.map((p, i) => (
                <div key={p._id} className="card animate-fade-up" style={{ animationDelay: `${i * 0.03}s` }}>
                  <div className="card-body" style={{
                    padding: '11px 16px',
                    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                  }}>

                    {/* Status icon */}
                    <div style={{
                      width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                      background: p.status === 'PAID' ? '#DCFCE7' : '#FEE2E2',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                    }}>
                      {p.status === 'PAID' ? '✅' : '❌'}
                    </div>

                    {/* TXN id + order ref */}
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        TXN-{p._id?.slice(-10).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                        Order: {p.orderId?.slice(-10)}
                        {p.createdAt && (
                          <span style={{ marginLeft: 10 }}>
                            {new Date(p.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={`badge ${p.status === 'PAID' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 11 }}>
                      {p.status}
                    </span>

                    {/* Amount */}
                    {p.amount && (
                      <span style={{
                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
                        color: p.status === 'PAID' ? 'var(--accent-3)' : 'var(--ink-muted)',
                      }}>
                        ${Number(p.amount).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
