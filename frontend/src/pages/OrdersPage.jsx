import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOrders, getMenuItem } from '../services/api';
import { useToast } from '../components/Toast';

const STATUS = {
  CONFIRMED: { label: 'Confirmed', cls: 'badge-green', icon: '✓'  },
  CREATED:   { label: 'Pending',   cls: 'badge-amber', icon: '⏳' },
  CANCELLED: { label: 'Cancelled', cls: 'badge-red',   icon: '✕'  },
  PAID:      { label: 'Paid',      cls: 'badge-blue',  icon: '💳' },
};

export default function OrdersPage() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { token }  = useAuth();
  const { toast }  = useToast();

  useEffect(() => {
    getOrders(token)
      .then(async (r) => {
        const raw = r.data.reverse();

        // For each order, fetch the menu item using itemId to get its name
        const enriched = await Promise.all(
          raw.map(async (order) => {
            if (!order.itemId) return { ...order, itemName: 'Unknown Item', itemCategory: '' };
            try {
              const { data } = await getMenuItem(order.itemId);
              return {
                ...order,
                itemName:     data.name     || 'Unknown Item',
                itemCategory: data.category || '',
              };
            } catch {
              // If menu item fetch fails, fallback gracefully
              return { ...order, itemName: 'Item not found', itemCategory: '' };
            }
          })
        );

        setOrders(enriched);
      })
      .catch(() => toast('Could not load orders', 'error'))
      .finally(() => setLoading(false));
  }, [token]);

  const foodEmoji = (cat) =>
    cat === 'drink' ? '🥤' : cat === 'dessert' ? '🍰' : cat === 'starter' ? '🥗' : '🍽️';

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  return (
    <div style={{ padding: '32px 0 64px' }}>
      <div className="container">

        {/* Header */}
        <div className="page-header">
          <h1>My Orders</h1>
          <p>{orders.length} total order{orders.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Stats row */}
        {orders.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 12, marginBottom: 32 }}>
            {[
              { label: 'Total',     value: orders.length,                                       color: 'var(--ink)' },
              { label: 'Confirmed', value: orders.filter(o => o.status === 'CONFIRMED').length, color: 'var(--accent-3)' },
              { label: 'Pending',   value: orders.filter(o => o.status === 'CREATED').length,   color: '#D97706' },
              { label: 'Cancelled', value: orders.filter(o => o.status === 'CANCELLED').length, color: '#DC2626' },
            ].map(s => (
              <div key={s.label} style={{
                padding: '14px 16px', borderRadius: 'var(--radius-md)',
                background: 'var(--surface)', border: '1px solid var(--border)',
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: s.color, lineHeight: 1.1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Orders list */}
        {orders.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📦</span>
            <h3>No orders yet</h3>
            <p>Your order history will appear here once you place your first order</p>
            <Link to="/menu">
              <button className="btn btn-accent" style={{ marginTop: 8 }}>Order Now</button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.map((order, i) => {
              const sc = STATUS[order.status] || { label: order.status, cls: 'badge-gray', icon: '?' };

              return (
                <div key={order._id} className="card animate-fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>

                    {/* Emoji thumbnail */}
                    <div style={{
                      width: 52, height: 52, borderRadius: 'var(--radius-md)', flexShrink: 0,
                      background: `hsl(${(order.itemName?.charCodeAt(0) || 65) * 7 % 360}, 25%, 92%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                    }}>
                      {foodEmoji(order.itemCategory)}
                    </div>

                    {/* Main info */}
                    <div style={{ flex: 1, minWidth: 160 }}>

                      {/* Item name — fetched from menu service */}
                      <div style={{
                        fontFamily: 'var(--font-display)', fontWeight: 700,
                        fontSize: 16, marginBottom: 5,
                      }}>
                        {order.itemName}
                      </div>

                      {/* Secondary details — NO itemId shown */}
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', fontSize: 13, color: 'var(--ink-muted)' }}>
                        <span className={`badge ${sc.cls}`} style={{ fontSize: 11 }}>
                          {sc.icon} {sc.label}
                        </span>
                        <span>Order #{order._id?.slice(-8).toUpperCase()}</span>
                        <span>Qty: <strong style={{ color: 'var(--ink-soft)' }}>{order.quantity || 1}</strong></span>
                        {order.createdAt && (
                          <span>
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price + payment ref */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {order.totalPrice > 0 && (
                        <div className="price" style={{ fontSize: 20 }}>
                          ${Number(order.totalPrice).toFixed(2)}
                        </div>
                      )}
                      {order.paymentId && (
                        <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 3 }}>
                          Payment #{order.paymentId?.slice(-8)}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
