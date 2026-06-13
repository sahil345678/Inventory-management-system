import { useState, useEffect } from 'react'
import { getOrders, getOrder, createOrder, deleteOrder, getProducts, getCustomers } from '../api/api'
import Modal from './common/Modal'
import { useToast, ToastContainer } from './common/Toast'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showDetail, setShowDetail] = useState(null)
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const { toasts, addToast } = useToast()

  useEffect(() => { loadOrders() }, [])

  const loadOrders = async () => {
    try {
      const res = await getOrders()
      setOrders(res.data)
    } catch { addToast('Failed to load orders', 'error') }
    finally { setLoading(false) }
  }

  const openCreate = async () => {
    try {
      const [pRes, cRes] = await Promise.all([getProducts(), getCustomers()])
      setProducts(pRes.data)
      setCustomers(cRes.data)
      setCustomerId('')
      setItems([{ product_id: '', quantity: 1 }])
      setErrors({})
      setShowCreate(true)
    } catch { addToast('Failed to load data', 'error') }
  }

  const addItem = () => setItems(prev => [...prev, { product_id: '', quantity: 1 }])
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i))
  const updateItem = (i, field, val) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item))
  }

  const calcTotal = () => {
    return items.reduce((sum, item) => {
      const prod = products.find(p => p.id === Number(item.product_id))
      return sum + (prod ? prod.price * item.quantity : 0)
    }, 0)
  }

  const validate = () => {
    const e = {}
    if (!customerId) e.customer = 'Select a customer'
    const validItems = items.filter(i => i.product_id)
    if (validItems.length === 0) e.items = 'Add at least one product'
    items.forEach((item, i) => {
      if (item.product_id) {
        const prod = products.find(p => p.id === Number(item.product_id))
        if (prod && item.quantity > prod.quantity_in_stock) {
          e[`item_${i}`] = `Only ${prod.quantity_in_stock} in stock`
        }
      }
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      await createOrder({
        customer_id: Number(customerId),
        items: items.filter(i => i.product_id).map(i => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
        })),
      })
      addToast('Order created successfully')
      setShowCreate(false)
      loadOrders()
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to create order', 'error')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (order) => {
    if (!confirm(`Delete Order #${order.id}?`)) return
    try {
      await deleteOrder(order.id)
      addToast('Order deleted, stock restored')
      loadOrders()
    } catch (err) {
      addToast(err.response?.data?.detail || 'Delete failed', 'error')
    }
  }

  const viewDetail = async (orderId) => {
    try {
      const res = await getOrder(orderId)
      setShowDetail(res.data)
    } catch { addToast('Failed to load order details', 'error') }
  }

  if (loading) return <div className="loading"><div className="spinner" />Loading orders...</div>

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <div className="page-header">
        <h1>Orders</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Create Order</button>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>🛒 All Orders ({orders.length})</h2>
        </div>
        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛒</div>
            <h3>No orders yet</h3>
            <p>Create your first order to get started</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 700 }}>#{o.id}</td>
                    <td>{o.customer_name || `Customer #${o.customer_id}`}</td>
                    <td>{o.items?.length || 0}</td>
                    <td style={{ fontWeight: 600 }}>${o.total_amount.toFixed(2)}</td>
                    <td><span className="badge badge-success">{o.status}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => viewDetail(o.id)}>View</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(o)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {showCreate && (
        <Modal
          title="Create Order"
          onClose={() => setShowCreate(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Order'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label>Customer</label>
            <select className={`form-control ${errors.customer ? 'error' : ''}`} value={customerId} onChange={e => setCustomerId(e.target.value)}>
              <option value="">Select a customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>)}
            </select>
            {errors.customer && <div className="form-error">{errors.customer}</div>}
          </div>

          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order Items</label>
          {errors.items && <div className="form-error" style={{ marginBottom: 8 }}>{errors.items}</div>}

          {items.map((item, i) => (
            <div className="order-item-row" key={i}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <select className={`form-control ${errors[`item_${i}`] ? 'error' : ''}`} value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}>
                  <option value="">Select product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (${p.price} | Stock: {p.quantity_in_stock})</option>
                  ))}
                </select>
                {errors[`item_${i}`] && <div className="form-error">{errors[`item_${i}`]}</div>}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input type="number" min="1" className="form-control" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} />
              </div>
              <button className="btn btn-danger btn-icon" onClick={() => removeItem(i)} disabled={items.length <= 1} style={{ marginBottom: 0 }}>&times;</button>
            </div>
          ))}

          <button className="btn btn-secondary btn-sm" onClick={addItem} style={{ marginTop: 4 }}>+ Add Item</button>

          <div className="order-total">
            <span>Estimated Total</span>
            <span>${calcTotal().toFixed(2)}</span>
          </div>
        </Modal>
      )}

      {/* Order Detail Modal */}
      {showDetail && (
        <Modal title={`Order #${showDetail.id}`} onClose={() => setShowDetail(null)}>
          <div style={{ marginBottom: '1rem' }}>
            <p><strong>Customer:</strong> {showDetail.customer_name}</p>
            <p><strong>Status:</strong> <span className="badge badge-success">{showDetail.status}</span></p>
            <p><strong>Date:</strong> {new Date(showDetail.created_at).toLocaleString()}</p>
          </div>
          <table style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {showDetail.items?.map(item => (
                <tr key={item.id}>
                  <td>{item.product_name}</td>
                  <td><span className="badge badge-success">{item.product_sku}</span></td>
                  <td>{item.quantity}</td>
                  <td>${item.unit_price.toFixed(2)}</td>
                  <td style={{ fontWeight: 600 }}>${item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="order-total">
            <span>Total Amount</span>
            <span>${showDetail.total_amount.toFixed(2)}</span>
          </div>
        </Modal>
      )}
    </div>
  )
}
