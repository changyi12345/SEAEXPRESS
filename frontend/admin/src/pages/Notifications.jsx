import { useState, useEffect } from 'react'
import axios from 'axios'
import Toast from '../components/Toast'

export default function Notifications() {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    titleMyanmar: '',
    message: '',
    messageMyanmar: '',
    type: 'info',
    recipientType: 'all',
    recipientIds: [],
    restaurantIds: [],
    shopIds: []
  })
  const [users, setUsers] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [shops, setShops] = useState([])
  const [riders, setRiders] = useState([])
  const [sentNotifications, setSentNotifications] = useState([])

  useEffect(() => {
    fetchData()
    fetchNotifications()
  }, [])

  const fetchData = async () => {
    try {
      const [usersRes, restaurantsRes, shopsRes, ridersRes] = await Promise.all([
        axios.get('/admin/users?role=user'),
        axios.get('/admin/restaurants'),
        axios.get('/admin/shops'),
        axios.get('/admin/users?role=rider')
      ])
      setUsers(usersRes.data.users || [])
      setRestaurants(restaurantsRes.data.restaurants || [])
      setShops(shopsRes.data.shops || [])
      setRiders(ridersRes.data.users || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/admin/notifications')
      setSentNotifications(res.data.notifications || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setToast(null)

    try {
      await axios.post('/admin/notifications/send', formData)
      setToast({ message: 'Notification sent successfully!', type: 'success' })
      setShowForm(false)
      setFormData({
        title: '',
        titleMyanmar: '',
        message: '',
        messageMyanmar: '',
        type: 'info',
        recipientType: 'all',
        recipientIds: [],
        restaurantIds: [],
        shopIds: []
      })
      fetchNotifications()
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to send notification', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleRecipientToggle = (id, type) => {
    if (type === 'user') {
      setFormData(prev => ({
        ...prev,
        recipientIds: prev.recipientIds.includes(id)
          ? prev.recipientIds.filter(rid => rid !== id)
          : [...prev.recipientIds, id]
      }))
    } else if (type === 'restaurant') {
      setFormData(prev => ({
        ...prev,
        restaurantIds: prev.restaurantIds.includes(id)
          ? prev.restaurantIds.filter(rid => rid !== id)
          : [...prev.restaurantIds, id]
      }))
    } else if (type === 'shop') {
      setFormData(prev => ({
        ...prev,
        shopIds: prev.shopIds.includes(id)
          ? prev.shopIds.filter(sid => sid !== id)
          : [...prev.shopIds, id]
      }))
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800 border-green-300'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'error': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-blue-100 text-blue-800 border-blue-300'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
        >
          {showForm ? 'Cancel' : '+ Send Notification'}
        </button>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Send Notification</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-semibold">Title (English) *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">Title (Myanmar)</label>
                <input
                  type="text"
                  value={formData.titleMyanmar}
                  onChange={(e) => setFormData({ ...formData, titleMyanmar: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-semibold">Message (English) *</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  rows="3"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">Message (Myanmar)</label>
                <textarea
                  value={formData.messageMyanmar}
                  onChange={(e) => setFormData({ ...formData, messageMyanmar: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  rows="3"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-semibold">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  required
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-semibold">Recipient Type *</label>
                <select
                  value={formData.recipientType}
                  onChange={(e) => setFormData({ ...formData, recipientType: e.target.value, recipientIds: [], restaurantIds: [], shopIds: [] })}
                  className="w-full px-4 py-2 border rounded"
                  required
                >
                  <option value="all">All Users</option>
                  <option value="user">Users Only</option>
                  <option value="restaurant-admin">Restaurant Admins</option>
                  <option value="shop-admin">Shop Admins</option>
                  <option value="rider">Riders Only</option>
                  <option value="specific">Specific Users</option>
                </select>
              </div>
            </div>

            {/* Specific Recipients Selection */}
            {formData.recipientType === 'specific' && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">Select Specific Users</h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {users.map(user => (
                    <label key={user._id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.recipientIds.includes(user._id)}
                        onChange={() => handleRecipientToggle(user._id, 'user')}
                        className="rounded"
                      />
                      <span>{user.name} ({user.email})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Restaurant Selection */}
            {formData.recipientType === 'restaurant-admin' && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">Select Restaurants (Leave empty for all)</h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {restaurants.map(restaurant => (
                    <label key={restaurant._id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.restaurantIds.includes(restaurant._id)}
                        onChange={() => handleRecipientToggle(restaurant._id, 'restaurant')}
                        className="rounded"
                      />
                      <span>{restaurant.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Shop Selection */}
            {formData.recipientType === 'shop-admin' && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3">Select Shops (Leave empty for all)</h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {shops.map(shop => (
                    <label key={shop._id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.shopIds.includes(shop._id)}
                        onChange={() => handleRecipientToggle(shop._id, 'shop')}
                        className="rounded"
                      />
                      <span>{shop.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Notification'}
            </button>
          </form>
        </div>
      )}

      {/* Sent Notifications List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Sent Notifications</h2>
        </div>
        <div className="divide-y">
          {sentNotifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No notifications sent yet</div>
          ) : (
            sentNotifications.map(notification => (
              <div key={notification._id} className="p-6">
                <div className={`p-4 rounded-lg border ${getTypeColor(notification.type)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{notification.title}</h3>
                      {notification.titleMyanmar && (
                        <p className="text-sm opacity-90">{notification.titleMyanmar}</p>
                      )}
                    </div>
                    <span className="text-xs opacity-70">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mb-2">{notification.message}</p>
                  {notification.messageMyanmar && (
                    <p className="text-sm opacity-80">{notification.messageMyanmar}</p>
                  )}
                  <div className="mt-2 text-xs opacity-70">
                    <span>To: {notification.recipientType}</span>
                    {notification.sentBy && (
                      <span className="ml-4">By: {notification.sentBy.name}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

