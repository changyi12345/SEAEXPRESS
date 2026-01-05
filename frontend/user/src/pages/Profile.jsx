import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import ImageUpload from '../components/ImageUpload'

export default function Profile() {
  const { user, isAuthenticated, fetchUser } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  // Profile form data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: {
      street: '',
      city: 'Yangon',
      township: '',
      zone: ''
    }
  })
  
  // Password change form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // Orders
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || 'Yangon',
          township: user.address?.township || '',
          zone: user.address?.zone || ''
        }
      })
    }
    if (activeTab === 'orders') {
      fetchOrders()
    }
  }, [user, isAuthenticated, activeTab])

  const fetchOrders = async () => {
    setOrdersLoading(true)
    try {
      const res = await axios.get('/users/orders')
      setOrders(res.data.orders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const res = await axios.put('/users/profile', formData)
      if (fetchUser) {
        await fetchUser()
      }
      setMessage('Profile updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New passwords do not match')
      setLoading(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setMessage('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      await axios.put('/users/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      setMessage('Password changed successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (imageUrl) => {
    setLoading(true)
    setMessage('')
    try {
      await axios.put('/users/profile', { avatar: imageUrl })
      if (fetchUser) {
        await fetchUser()
      }
      setMessage('Profile picture updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Failed to update profile picture')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      'rider-assigned': 'bg-purple-100 text-purple-800',
      'picking-up': 'bg-indigo-100 text-indigo-800',
      'picked-up': 'bg-teal-100 text-teal-800',
      delivering: 'bg-green-100 text-green-800',
      delivered: 'bg-green-200 text-green-900',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pending',
      preparing: 'Preparing',
      'rider-assigned': 'Rider Assigned',
      'picking-up': 'Picking Up',
      'picked-up': 'Picked Up',
      delivering: 'Delivering',
      delivered: 'Delivered',
      completed: 'Completed',
      cancelled: 'Cancelled'
    }
    return texts[status] || status
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.restaurant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shop?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === '' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (!isAuthenticated) {
    return <div className="container mx-auto px-4 py-8 text-center">Please login to view profile</div>
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-primary"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary flex items-center justify-center text-white text-2xl sm:text-3xl font-bold border-4 border-primary">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="absolute bottom-0 right-0 bg-accent rounded-full p-1.5 sm:p-2 border-4 border-white">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary">{user?.name || 'User'}</h1>
              <p className="text-sm sm:text-base text-gray-600">{user?.email}</p>
              <p className="text-xs sm:text-sm text-gray-500">{user?.phone}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-4 md:mb-6 overflow-x-auto">
          <div className="flex border-b min-w-max sm:min-w-0">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 sm:px-6 py-3 sm:py-4 font-semibold text-sm sm:text-base transition whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-4 sm:px-6 py-3 sm:py-4 font-semibold text-sm sm:text-base transition whitespace-nowrap ${
                activeTab === 'password'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              Change Password
            </button>
            <button
              onClick={() => {
                setActiveTab('orders')
                fetchOrders()
              }}
              className={`px-4 sm:px-6 py-3 sm:py-4 font-semibold text-sm sm:text-base transition whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-primary'
              }`}
            >
              My Orders
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          {message && (
            <div className={`mb-4 md:mb-6 p-3 md:p-4 rounded-lg text-sm sm:text-base ${
              message.includes('success') 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}>
              {message}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4 md:space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 md:mb-4">Profile Information</h2>
                
                {/* Profile Picture Upload */}
                <div className="mb-4 md:mb-6">
                  <label className="block mb-2 font-semibold text-sm sm:text-base">Profile Picture</label>
                  <ImageUpload
                    label=""
                    existingImage={user?.avatar}
                    onUpload={handleImageUpload}
                  />
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label className="block mb-2 font-semibold text-sm sm:text-base text-gray-700">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary touch-manipulation"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold text-sm sm:text-base text-gray-700">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                    <p className="text-sm text-gray-500 mt-1.5">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold text-sm sm:text-base text-gray-700">Phone *</label>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary touch-manipulation"
                      placeholder="09xxxxxxxxx"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-2 font-semibold">Street Address</label>
                    <input
                      type="text"
                      value={formData.address.street}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, street: e.target.value }
                      })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter your street address"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 font-semibold">Township</label>
                      <input
                        type="text"
                        value={formData.address.township}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, township: e.target.value }
                        })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="e.g., Bahan"
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
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Select Zone</option>
                        <option value="ဗဟိုခရိုင်">ဗဟိုခရိုင်</option>
                        <option value="အရှေ့ပိုင်း">အရှေ့ပိုင်း</option>
                        <option value="အနောက်ပိုင်း">အနောက်ပိုင်း</option>
                        <option value="အဝေးပိုင်း">အဝေးပိုင်း</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-primary text-white px-6 py-3.5 rounded-lg hover:bg-primary-dark active:bg-primary-dark transition font-semibold disabled:opacity-50 w-full md:w-auto touch-manipulation min-h-[44px] shadow-md"
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Password Change Tab */}
          {activeTab === 'password' && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div>
                  <label className="block mb-2 font-semibold text-sm sm:text-base text-gray-700">Current Password *</label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary touch-manipulation"
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-sm sm:text-base text-gray-700">New Password *</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary touch-manipulation"
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                  />
                  <p className="text-sm text-gray-500 mt-1.5">Must be at least 6 characters</p>
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-sm sm:text-base text-gray-700">Confirm New Password *</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary touch-manipulation"
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-white px-6 py-3.5 rounded-lg hover:bg-primary-dark active:bg-primary-dark transition font-semibold disabled:opacity-50 w-full md:w-auto touch-manipulation min-h-[44px] shadow-md"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">My Orders</h2>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="picking-up">Picking Up</option>
                    <option value="delivering">Delivering</option>
                    <option value="delivered">Delivered</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {ordersLoading ? (
                <div className="text-center py-12">Loading orders...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No orders found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <Link
                      key={order._id}
                      to={`/orders/${order._id}`}
                      className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <span className="font-bold text-primary">#{order.orderNumber}</span>
                            <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-600">
                            {order.restaurant?.name || order.shop?.name || 'User-to-User Delivery'}
                          </p>
                          {order.rider && (
                            <p className="text-sm text-gray-500">Rider: {order.rider.name}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary text-lg">{order.total} Ks</p>
                          <p className="text-sm text-gray-500">View Details →</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
