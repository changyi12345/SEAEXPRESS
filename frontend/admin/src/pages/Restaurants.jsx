import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import axios from 'axios'
import Toast from '../components/Toast'

export default function Restaurants() {
  const { isAuthenticated } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()
  const [restaurants, setRestaurants] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [approvalFilter, setApprovalFilter] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showOwnerModal, setShowOwnerModal] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
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
  const [ownerId, setOwnerId] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      fetchRestaurants()
      fetchUsers()
    }
  }, [isAuthenticated])

  // Real-time updates
  useEffect(() => {
    if (!socket) return

    const handleUpdate = () => {
      fetchRestaurants()
    }

    socket.on('order-updated', handleUpdate)

    return () => {
      socket.off('order-updated', handleUpdate)
    }
  }, [socket])

  const fetchRestaurants = async () => {
    try {
      const res = await axios.get('/admin/restaurants')
      setRestaurants(res.data.restaurants)
    } catch (error) {
      console.error('Error fetching restaurants:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/admin/users')
      setUsers(res.data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleAddRestaurant = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/admin/restaurants', formData)
      fetchRestaurants()
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
      setToast({ message: 'Restaurant added successfully!', type: 'success' })
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to add restaurant', type: 'error' })
      console.error('Error adding restaurant:', error)
    }
  }

  const handleAssignOwner = async () => {
    if (!ownerId) {
      setToast({ message: 'Please select an owner', type: 'error' })
      return
    }
    try {
      await axios.put(`/admin/restaurants/${selectedRestaurant._id}/owner`, { ownerId })
      fetchRestaurants()
      setShowOwnerModal(false)
      setSelectedRestaurant(null)
      setOwnerId('')
      setToast({ message: 'Owner assigned successfully!', type: 'success' })
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to assign owner', type: 'error' })
      console.error('Error assigning owner:', error)
    }
  }

  const toggleActive = async (id, isActive) => {
    try {
      await axios.put(`/admin/restaurants/${id}`, { isActive: !isActive })
      fetchRestaurants()
      setToast({ message: 'Restaurant status updated successfully', type: 'success' })
    } catch (error) {
      setToast({ message: 'Failed to update restaurant', type: 'error' })
    }
  }

  const handleApprove = async (id) => {
    try {
      await axios.post(`/admin/restaurants/${id}/approve`)
      fetchRestaurants()
      setToast({ message: 'Restaurant approved successfully', type: 'success' })
    } catch (error) {
      setToast({ message: 'Failed to approve restaurant', type: 'error' })
    }
  }

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = searchTerm === '' || 
      restaurant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.nameMyanmar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.phone?.includes(searchTerm) ||
      restaurant.address?.township?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesApproval = approvalFilter === '' || 
      (approvalFilter === 'approved' && restaurant.isApproved) ||
      (approvalFilter === 'pending' && !restaurant.isApproved)
    
    return matchesSearch && matchesApproval
  })

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Restaurants</h1>
        <div className="flex gap-4">
          <button
            onClick={fetchRestaurants}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition flex items-center gap-2"
            title="Refresh"
          >
            <span>🔄</span> Refresh
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
          >
            {showAddForm ? 'Cancel' : '+ Add Restaurant'}
          </button>
          <input
            type="text"
            placeholder="Search restaurants..."
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
          <h2 className="text-xl font-semibold mb-4">Add New Restaurant</h2>
          <form onSubmit={handleAddRestaurant} className="space-y-4">
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
            <div className="grid md:grid-cols-2 gap-4">
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
                <label className="block mb-2 font-semibold">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                />
              </div>
            </div>
            <div>
              <label className="block mb-2 font-semibold">Address</label>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Street"
                  value={formData.address.street}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value }
                  })}
                  className="w-full px-4 py-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Township"
                  value={formData.address.township}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, township: e.target.value }
                  })}
                  className="w-full px-4 py-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="City"
                  value={formData.address.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value }
                  })}
                  className="w-full px-4 py-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Zone"
                  value={formData.address.zone}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, zone: e.target.value }
                  })}
                  className="w-full px-4 py-2 border rounded"
                />
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

            <button
              type="submit"
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition"
            >
              Add Restaurant
            </button>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRestaurants.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                  No restaurants found
                </td>
              </tr>
            ) : (
              filteredRestaurants.map((restaurant) => (
              <tr key={restaurant._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium">{restaurant.name}</div>
                    <div className="text-sm text-gray-500">{restaurant.nameMyanmar}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{restaurant.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">{restaurant.address?.township}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {restaurant.owner ? (
                    <div>
                      <div className="font-medium">{restaurant.owner.name}</div>
                      <div className="text-sm text-gray-500">{restaurant.owner.email}</div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedRestaurant(restaurant)
                        setShowOwnerModal(true)
                      }}
                      className="text-primary hover:underline text-sm"
                    >
                      Assign Owner
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="flex items-center">
                    ⭐ {restaurant.rating.toFixed(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${restaurant.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {restaurant.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${restaurant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {restaurant.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => navigate(`/restaurants/${restaurant._id}`)}
                      className="px-3 py-1 rounded text-sm bg-primary text-white hover:bg-primary-dark"
                    >
                      View Details
                    </button>
                    <div className="flex space-x-2">
                      {!restaurant.owner && (
                        <button
                          onClick={() => {
                            setSelectedRestaurant(restaurant)
                            setShowOwnerModal(true)
                          }}
                          className="px-3 py-1 rounded text-sm bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                          Assign Owner
                        </button>
                      )}
                      {!restaurant.isApproved && (
                        <button
                          onClick={() => handleApprove(restaurant._id)}
                          className="px-3 py-1 rounded text-sm bg-green-100 text-green-800 hover:bg-green-200"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => toggleActive(restaurant._id, restaurant.isActive)}
                        className={`px-3 py-1 rounded text-sm ${restaurant.isActive ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                      >
                        {restaurant.isActive ? 'Deactivate' : 'Activate'}
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

