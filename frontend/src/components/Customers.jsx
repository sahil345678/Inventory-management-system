import { useState, useEffect } from 'react'
import { getCustomers, createCustomer, deleteCustomer } from '../api/api'
import Modal from './common/Modal'
import { useToast, ToastContainer } from './common/Toast'

const emptyForm = { full_name: '', email: '', phone: '' }

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const { toasts, addToast } = useToast()

  useEffect(() => { loadCustomers() }, [])

  const loadCustomers = async () => {
    try {
      const res = await getCustomers()
      setCustomers(res.data)
    } catch { addToast('Failed to load customers', 'error') }
    finally { setLoading(false) }
  }

  const validate = () => {
    const e = {}
    if (!form.full_name.trim()) e.full_name = 'Name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    if (!form.phone.trim()) e.phone = 'Phone is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await createCustomer({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      })
      addToast('Customer created successfully')
      closeModal()
      loadCustomers()
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to create customer', 'error')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (c) => {
    if (!confirm(`Delete customer "${c.full_name}"?`)) return
    try {
      await deleteCustomer(c.id)
      addToast('Customer deleted')
      loadCustomers()
    } catch (err) {
      addToast(err.response?.data?.detail || 'Delete failed', 'error')
    }
  }

  const closeModal = () => { setShowModal(false); setForm(emptyForm); setErrors({}) }

  const onChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const filtered = customers.filter(c => {
    if (!search) return true
    const s = search.toLowerCase()
    return c.full_name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s) || c.phone.includes(s)
  })

  if (loading) return <div className="loading"><div className="spinner" />Loading customers...</div>

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <div className="page-header">
        <h1>Customers</h1>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setErrors({}); setShowModal(true) }}>+ Add Customer</button>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>👥 All Customers ({filtered.length})</h2>
          <input
            className="form-control search-input"
            placeholder="🔍 Search customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 280 }}
          />
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>{search ? 'No matching customers' : 'No customers yet'}</h3>
            <p>{search ? 'Try a different search term' : 'Add your first customer to get started'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar">{c.full_name.charAt(0).toUpperCase()}</div>
                        {c.full_name}
                      </div>
                    </td>
                    <td style={{ color: 'var(--accent-blue-light)' }}>{c.email}</td>
                    <td>{c.phone}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c)}>🗑 Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title="Add Customer"
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : 'Create'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input className={`form-control ${errors.full_name ? 'error' : ''}`} value={form.full_name} onChange={e => onChange('full_name', e.target.value)} placeholder="John Doe" />
              {errors.full_name && <div className="form-error">{errors.full_name}</div>}
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" className={`form-control ${errors.email ? 'error' : ''}`} value={form.email} onChange={e => onChange('email', e.target.value)} placeholder="john@example.com" />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input className={`form-control ${errors.phone ? 'error' : ''}`} value={form.phone} onChange={e => onChange('phone', e.target.value)} placeholder="+1 234 567 8900" />
              {errors.phone && <div className="form-error">{errors.phone}</div>}
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
