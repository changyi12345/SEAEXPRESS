import { useState, useEffect } from 'react'
import axios from 'axios'
import ImageUpload from '../components/ImageUpload'

export default function Products() {
  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    nameMyanmar: '',
    description: '',
    descriptionMyanmar: '',
    price: '',
    originalPrice: '',
    discountPercentage: 0,
    image: '',
    category: '',
    stock: 0,
    isAvailable: true
  })

  useEffect(() => {
    fetchShop()
  }, [])

  const fetchShop = async () => {
    try {
      const res = await axios.get('/shop-owners/my-shop')
      setShop(res.data.shop)
      setProducts(res.data.shop.products || [])
    } catch (error) {
      console.error('Error fetching shop:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation: If discount percentage > 0, originalPrice must be set
    if (formData.discountPercentage > 0 && !formData.originalPrice) {
      alert('Please set original price when adding discount')
      return
    }
    
    // If no discount, set originalPrice to null
    const submitData = {
      ...formData,
      price: parseFloat(formData.price),
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
      discountPercentage: parseFloat(formData.discountPercentage) || 0,
      stock: parseInt(formData.stock) || 0
    }
    
    // If discount is 0, clear originalPrice
    if (submitData.discountPercentage === 0) {
      submitData.originalPrice = null
    }
    
    try {
      if (editingProduct) {
        await axios.put(`/shop-owners/my-shop/products/${editingProduct._id}`, submitData)
      } else {
        await axios.post('/shop-owners/my-shop/products', submitData)
      }
      fetchShop()
      setShowForm(false)
      setEditingProduct(null)
      setFormData({
        name: '',
        nameMyanmar: '',
        description: '',
        descriptionMyanmar: '',
        price: '',
        originalPrice: '',
        discountPercentage: 0,
        image: '',
        category: '',
        stock: 0,
        isAvailable: true
      })
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Error saving product')
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      nameMyanmar: product.nameMyanmar,
      description: product.description || '',
      descriptionMyanmar: product.descriptionMyanmar || '',
      price: product.price,
      originalPrice: product.originalPrice || '',
      discountPercentage: product.discountPercentage || 0,
      image: product.image || '',
      category: product.category || '',
      stock: product.stock || 0,
      isAvailable: product.isAvailable
    })
    setShowForm(true)
  }

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await axios.delete(`/shop-owners/my-shop/products/${productId}`)
      fetchShop()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error deleting product')
    }
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingProduct(null)
            setFormData({
              name: '',
              nameMyanmar: '',
              description: '',
              descriptionMyanmar: '',
              price: '',
              image: '',
              category: '',
              stock: 0,
              isAvailable: true
            })
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
        >
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingProduct ? 'Edit Product' : 'Add Product'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-semibold">Name (English)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">Name (Myanmar)</label>
                <input
                  type="text"
                  value={formData.nameMyanmar}
                  onChange={(e) => setFormData({ ...formData, nameMyanmar: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  required
                />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block mb-2 font-semibold">Original Price (Ks) *</label>
                <input
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => {
                    const originalPrice = e.target.value
                    const discount = formData.discountPercentage || 0
                    const discountedPrice = originalPrice ? Math.round(originalPrice * (1 - discount / 100)) : ''
                    setFormData({ 
                      ...formData, 
                      originalPrice: originalPrice,
                      price: discountedPrice || formData.price
                    })
                  }}
                  className="w-full px-4 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={(e) => {
                    const discount = parseFloat(e.target.value) || 0
                    const originalPrice = formData.originalPrice || formData.price
                    const discountedPrice = originalPrice ? Math.round(originalPrice * (1 - discount / 100)) : formData.price
                    setFormData({ 
                      ...formData, 
                      discountPercentage: discount,
                      price: discountedPrice
                    })
                  }}
                  className="w-full px-4 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">Selling Price (Ks) *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border rounded bg-gray-100"
                  required
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Auto-calculated from discount</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-semibold">Stock</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                />
              </div>
            </div>
            <div>
              <ImageUpload
                label="Product Image"
                existingImage={formData.image}
                onUpload={(imageUrl) => setFormData({ ...formData, image: imageUrl })}
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="mr-2"
              />
              <label>Available</label>
            </div>
            <button
              type="submit"
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition"
            >
              {editingProduct ? 'Update' : 'Add'} Product
            </button>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product._id} className="bg-white rounded-lg shadow p-6">
            {product.image && (
              <img src={product.image} alt={product.name} className="w-full h-48 object-cover rounded mb-4" />
            )}
            <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
            <p className="text-gray-600 mb-2">{product.nameMyanmar}</p>
            <div className="mb-2">
              {product.discountPercentage > 0 && product.originalPrice ? (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg line-through text-gray-400">{product.originalPrice} Ks</span>
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      -{product.discountPercentage}%
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-primary">{product.price} Ks</p>
                </div>
              ) : (
                <p className="text-2xl font-bold text-primary">{product.price} Ks</p>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">Stock: {product.stock}</p>
            <div className="flex justify-between items-center">
              <span className={`px-3 py-1 rounded ${product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {product.isAvailable ? 'Available' : 'Unavailable'}
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => handleEdit(product)}
                  className="bg-secondary text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No products yet. Add your first product!</p>
        </div>
      )}
    </div>
  )
}

