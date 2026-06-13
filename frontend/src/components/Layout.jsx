import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/products', label: 'Products', icon: '📦' },
  { path: '/customers', label: 'Customers', icon: '👥' },
  { path: '/orders', label: 'Orders', icon: '🛒' },
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="app-layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>InvenTrack</span>
        <div style={{ width: 28 }} />
      </div>

      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>InvenTrack</h1>
          <p>Inventory & Order Management</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-link ${isActive && (item.path === '/' ? location.pathname === '/' : true) ? 'active' : ''}`
              }
              end={item.path === '/'}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>v1.0.0 • Built with ❤️</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
