import { useState, useEffect, useRef } from 'react'
import { getDashboard } from '../api/api'

function AnimatedCounter({ value, prefix = '', suffix = '', duration = 1200 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    let start = 0
    const end = typeof value === 'number' ? value : 0
    if (end === 0) { setDisplay(0); return }
    const startTime = performance.now()
    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.floor(eased * end))
      if (progress < 1) ref.current = requestAnimationFrame(animate)
    }
    ref.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(ref.current)
  }, [value, duration])

  return <>{prefix}{display.toLocaleString()}{suffix}</>
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadDashboard() }, [])

  const loadDashboard = async () => {
    try {
      const res = await getDashboard()
      setData(res.data)
    } catch (err) {
      console.error('Failed to load dashboard', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div>
      <div className="page-header"><h1>Dashboard</h1></div>
      <div className="stats-grid">
        {[1,2,3,4].map(i => <div key={i} className="stat-card blue" style={{minHeight:90}}><div className="skeleton-pulse" /></div>)}
      </div>
    </div>
  )

  if (!data) return <div className="empty-state"><h3>Failed to load dashboard data</h3></div>

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Primary Stats */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>Total Products</h3>
            <div className="stat-value"><AnimatedCounter value={data.total_products} /></div>
          </div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Total Customers</h3>
            <div className="stat-value"><AnimatedCounter value={data.total_customers} /></div>
          </div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon">🛒</div>
          <div className="stat-info">
            <h3>Total Orders</h3>
            <div className="stat-value"><AnimatedCounter value={data.total_orders} /></div>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <h3>Low Stock Items</h3>
            <div className="stat-value"><AnimatedCounter value={data.low_stock_products.length} /></div>
          </div>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className="stat-card blue">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Total Revenue</h3>
            <div className="stat-value" style={{ color: 'var(--accent-emerald-light)' }}>
              $<AnimatedCounter value={Math.floor(data.total_revenue)} />
            </div>
          </div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-icon">🏷️</div>
          <div className="stat-info">
            <h3>Inventory Value</h3>
            <div className="stat-value">
              $<AnimatedCounter value={Math.floor(data.total_inventory_value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Orders + Low Stock */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '0.5rem' }}>
        {/* Recent Orders */}
        <div className="card">
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            🕐 Recent Orders
          </h2>
          {data.recent_orders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No orders yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.recent_orders.map(o => (
                <div key={o.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.65rem 1rem',
                  background: 'rgba(99,102,241,0.04)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                }}>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--accent-blue-light)' }}>#{o.id}</span>
                    <span style={{ marginLeft: 10 }}>{o.customer_name}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: '0.75rem' }}>
                      {o.item_count} item{o.item_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--accent-emerald-light)' }}>${o.total_amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="card">
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>⚠️ Low Stock Alerts</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Products with 10 or fewer items in stock</p>
          {data.low_stock_products.length === 0 ? (
            <p style={{ color: 'var(--accent-emerald-light)', fontSize: '0.85rem' }}>✓ All products well stocked!</p>
          ) : (
            <div className="low-stock-list">
              {data.low_stock_products.map(p => (
                <div key={p.id} className="low-stock-item">
                  <div>
                    <span className="product-name">{p.name}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: '0.8rem' }}>SKU: {p.sku}</span>
                  </div>
                  <span className="product-stock">{p.quantity_in_stock} left</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
