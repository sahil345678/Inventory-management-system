import { useState, useEffect } from 'react'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/api'
import Modal from './common/Modal'
import { useToast, ToastContainer } from './common/Toast'

const emptyForm = { name: '', sku: '', price: '', quantity_in_stock: '' }

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const { toasts, addToast } = useToast()

  useEffect(() => { loadProducts() }, [])

  const loadProducts = async () => {
    try {
      const res = await getProducts()
      setProducts(res.data)
    } catch { addToast('Failed to load products', 'error') }
    finally { setLoading(false) }
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.sku.trim()) e.sku = 'SKU is required'
    if (!form.price || parseFloat(form.price) < 0) e.price = 'Valid price required'
    if (form.quantity_in_stock === '' || parseInt(form.quantity_in_stock) < 0) e.quantity_in_stock = 'Valid quantity required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: parseFloat(form.price),
      quantity_in_stock: parseInt(form.quantity_in_stock),
    }
    try {
      if (editing) {
        await updateProduct(editing.id, payload)
        addToast('Product updated successfully')
      } else {
        await createProduct(payload)
        addToast('Product created successfully')
      }
      closeModal()
      loadProducts()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Operation failed'
      addToast(msg, 'error')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (product) => {
    if (!confirm(`Delete "${product.name}"?`)) return
    try {
      await deleteProduct(product.id)
      addToast('Product deleted')
      loadProducts()
    } catch (err) {
      addToast(err.response?.data?.detail || 'Delete failed', 'error')
    }
  }

  const openEdit = (p) => {
    setEditing(p)
    setForm({ name: p.name, sku: p.sku, price: String(p.price), quantity_in_stock: String(p.quantity_in_stock) })
    setErrors({})
    setShowModal(true)
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditing(null); setForm(emptyForm); setErrors({}) }

  const onChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const filtered = products.filter(p => {
    if (!search) return true
    const s = search.toLowerCase()
    return p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s)
  })

  if (loading) return <div className="loading"><div className="spinner" />Loading products...</div>

  return (
    <div>
      <ToastContainer toasts={toasts} />
      <div className="page-header">
        <h1>Products</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Product</button>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>📦 All Products ({filtered.length})</h2>
          <input
            className="form-control search-input"
            placeholder="🔍 Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 280 }}
          />
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>{search ? 'No matching products' : 'No products yet'}</h3>
            <p>{search ? 'Try a different search term' : 'Add your first product to get started'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><span className="badge badge-success">{p.sku}</span></td>
                    <td>${p.price.toFixed(2)}</td>
                    <td>
                      <span className={p.quantity_in_stock <= 10 ? 'stock-low' : 'stock-ok'}>
                        {p.quantity_in_stock}
                      </span>
                    </td>
                    <td>
                      {p.quantity_in_stock === 0 ? (
                        <span className="badge badge-danger">Out of Stock</span>
                      ) : p.quantity_in_stock <= 10 ? (
                        <span className="badge badge-warning">Low Stock</span>
                      ) : (
                        <span className="badge badge-success">In Stock</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>✏️ Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p)}>🗑 Delete</button>
                      </div>
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
          title={editing ? 'Edit Product' : 'Add Product'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Product Name</label>
              <input className={`form-control ${errors.name ? 'error' : ''}`} value={form.name} onChange={e => onChange('name', e.target.value)} placeholder="Enter product name" />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>
            <div className="form-group">
              <label>SKU / Code</label>
              <input className={`form-control ${errors.sku ? 'error' : ''}`} value={form.sku} onChange={e => onChange('sku', e.target.value)} placeholder="e.g. PRD-001" />
              {errors.sku && <div className="form-error">{errors.sku}</div>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Price ($)</label>
                <input type="number" step="0.01" min="0" className={`form-control ${errors.price ? 'error' : ''}`} value={form.price} onChange={e => onChange('price', e.target.value)} placeholder="0.00" />
                {errors.price && <div className="form-error">{errors.price}</div>}
              </div>
              <div className="form-group">
                <label>Quantity in Stock</label>
                <input type="number" min="0" className={`form-control ${errors.quantity_in_stock ? 'error' : ''}`} value={form.quantity_in_stock} onChange={e => onChange('quantity_in_stock', e.target.value)} placeholder="0" />
                {errors.quantity_in_stock && <div className="form-error">{errors.quantity_in_stock}</div>}
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
