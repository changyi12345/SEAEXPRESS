import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import axios from 'axios'
import Toast from '../components/Toast'

export default function Shops() {
  const { isAuthenticated } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [approvalFilter, setApprovalFilter] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [toast, setToast] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    nameMyanmar: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: 'Yangon',
      township: '',
      zone: ''
    },
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerPassword: ''
  })

  useEffect(() => {
    if (isAuthenticated) {
      fetchShops()
    }
  }, [isAuthenticated])

  // Real-time updates
  useEffect(() => {
    if (!socket) return

    const handleUpdate = () => {
      fetchShops()
    }

    socket.on('order-updated', handleUpdate)

    return () => {
      socket.off('order-updated', handleUpdate)
    }
  }, [socket])

  const fetchShops = async () => {
    try {
      const res = await axios.get('/admin/shops')
      setShops(res.data.shops)
    } catch (error) {
      console.error('Error fetching shops:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddShop = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/admin/shops', formData)
      fetchShops()
      setShowAddForm(false)
      setFormData({
        name: '',
        nameMyanmar: '',
        phone: '',
        email: '',
        address: {
          street: '',
          city: 'Yangon',
          township: '',
          zone: ''
        },
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
        ownerPassword: ''
      })
      setToast({ message: 'Shop added successfully!', type: 'success' })
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to add shop', type: 'error' })
      console.error('Error adding shop:', error)
    }
  }

  const toggleActive = async (id, isActive) => {
    try {
      await axios.put(`/admin/shops/${id}`, { isActive: !isActive })
      fetchShops()
      setToast({ message: 'Shop status updated successfully', type: 'success' })
    } catch (error) {
      setToast({ message: 'Failed to update shop', type: 'error' })
    }
  }

  const handleApprove = async (id) => {
    try {
      await axios.post(`/admin/shops/${id}/approve`)
      fetchShops()
      setToast({ message: 'Shop approved successfully', type: 'success' })
    } catch (error) {
      setToast({ message: 'Failed to approve shop', type: 'error' })
    }
  }

  const filteredShops = shops.filter(shop => {
    const matchesSearch = searchTerm === '' || 
      shop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.nameMyanmar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.phone?.includes(searchTerm) ||
      shop.address?.township?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesApproval = approvalFilter === '' || 
      (approvalFilter === 'approved' && shop.isApproved) ||
      (approvalFilter === 'pending' && !shop.isApproved)
    
    return matchesSearch && matchesApproval
  })

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Shops</h1>
        <div className="flex gap-4">
          <button
            onClick={fetchShops}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition flex items-center gap-2"
            title="Refresh"
          >
            <span>🔄</span> Refresh
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
          >
            {showAddForm ? 'Cancel' : '+ Add Shop'}
          </button>
          <input
            type="text"
            placeholder="Search shops..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Shop</h2>
          <form onSubmit={handleAddShop} className="space-y-4">
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
              <div>
                <label className="block mb-2 font-semibold">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">Email (Optional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">Address Street</label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value }
                  })}
                  className="w-full px-4 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">Township</label>
                <input
                  type="text"
                  value={formData.address.township}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, township: e.target.value }
                  })}
                  className="w-full px-4 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">Zone</label>
                <select
                  value={formData.address.zone}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, zone: e.target.value }
                  })}
                  className="w-full px-4 py-2 border rounded"
                  required
                >
                  <option value="">Select Zone</option>
                  <option value="Downtown">Downtown</option>
                  <option value="Inner City">Inner City</option>
                  <option value="Outer City">Outer City</option>
                  <option value="Satellite">Satellite</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-4">Owner Account (Auto-create)</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-semibold">Owner Name</label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-4 py-2 border rounded"
                    placeholder="Owner's Full Name"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold">Owner Email</label>
                  <input
                    type="email"
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                    className="w-full px-4 py-2 border rounded"
                    placeholder="For login"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold">Owner Phone</label>
                  <input
                    type="text"
                    value={formData.ownerPhone}
                    onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                    className="w-full px-4 py-2 border rounded"
                    placeholder="For login"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold">Owner Password</label>
                  <input
                    type="password"
                    value={formData.ownerPassword}
                    onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                    className="w-full px-4 py-2 border rounded"
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                * If an account with this email/phone exists, it will be assigned as the owner. 
                Otherwise, a new account will be created.
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
              >
                Save Shop
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Township</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredShops.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No shops found
                </td>
              </tr>
            ) : (
              filteredShops.map((shop) => (
              <tr key={shop._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <Link to={`/shops/${shop._id}`} className="font-medium hover:text-primary hover:underline">
                      {shop.name}
                    </Link>
                    <div className="text-sm text-gray-500">{shop.nameMyanmar}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{shop.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">{shop.address?.township}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="flex items-center">
                    ⭐ {shop.rating.toFixed(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${shop.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {shop.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${shop.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {shop.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => navigate(`/shops/${shop._id}`)}
                      className="px-3 py-1 rounded text-sm bg-primary text-white hover:bg-primary-dark"
                    >
                      View Details
                    </button>
                    <div className="flex space-x-2">
                      {!shop.isApproved && (
                        <button
                          onClick={() => handleApprove(shop._id)}
                          className="px-3 py-1 rounded text-sm bg-green-100 text-green-800 hover:bg-green-200"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => toggleActive(shop._id, shop.isActive)}
                        className={`px-3 py-1 rounded text-sm ${shop.isActive ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                      >
                        {shop.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

