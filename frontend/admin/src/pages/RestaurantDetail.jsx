import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import Toast from '../components/Toast'

export default function RestaurantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchRestaurant()
    }
  }, [isAuthenticated, id])

  const fetchRestaurant = async () => {
    try {
      const res = await axios.get(`/admin/restaurants/${id}`)
      setRestaurant(res.data.restaurant)
    } catch (error) {
      console.error('Error fetching restaurant:', error)
      setToast({ message: 'Failed to load restaurant details', type: 'error' })
      navigate('/restaurants')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!restaurant.owner) {
      setToast({ message: 'No owner assigned to this restaurant', type: 'error' })
      return
    }
    
    if (!newPassword || newPassword.length < 6) {
      setToast({ message: 'Password must be at least 6 characters', type: 'error' })
      return
    }

    setChangingPassword(true)
    try {
      await axios.put(`/admin/users/${restaurant.owner._id}`, {
        password: newPassword
      })
      setToast({ message: 'Password changed successfully', type: 'success' })
      setShowPasswordModal(false)
      setNewPassword('')
    } catch (error) {
      console.error('Error changing password:', error)
      setToast({ message: 'Failed to change password', type: 'error' })
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  if (!restaurant) {
    return <div className="container mx-auto px-4 py-8 text-center">Restaurant not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="mb-6">
        <button
          onClick={() => navigate('/restaurants')}
          className="text-primary hover:text-primary-dark mb-4 flex items-center gap-2"
        >
          ← Back to Restaurants
        </button>
        <h1 className="text-3xl font-bold">Restaurant Details</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-600">Name (English)</label>
                <p className="text-lg">{restaurant.name}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Name (Myanmar)</label>
                <p className="text-lg">{restaurant.nameMyanmar}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Phone</label>
                <p className="text-lg">{restaurant.phone}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Email</label>
                <p className="text-lg">{restaurant.email || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Rating</label>
                <p className="text-lg flex items-center gap-2">
                  ⭐ {restaurant.rating?.toFixed(1) || '0.0'} 
                  <span className="text-sm text-gray-500">({restaurant.reviewCount || 0} reviews)</span>
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Status</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-600">Approval Status</label>
                <p>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    restaurant.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {restaurant.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Active Status</label>
                <p>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    restaurant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {restaurant.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Created At</label>
                <p className="text-lg">{new Date(restaurant.createdAt).toLocaleString()}</p>
              </div>
              {restaurant.approvedAt && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Approved At</label>
                  <p className="text-lg">{new Date(restaurant.approvedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Address</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-600">Street</label>
            <p className="text-lg">{restaurant.address?.street || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600">Township</label>
            <p className="text-lg">{restaurant.address?.township || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600">City</label>
            <p className="text-lg">{restaurant.address?.city || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600">Zone</label>
            <p className="text-lg">{restaurant.address?.zone || '-'}</p>
          </div>
        </div>
      </div>

      {restaurant.owner && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Owner Information</h2>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
            >
              Change Password
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-600">Owner Name</label>
              <p className="text-lg">{restaurant.owner.name}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Owner Email</label>
              <p className="text-lg">{restaurant.owner.email}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Owner Phone</label>
              <p className="text-lg">{restaurant.owner.phone}</p>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-semibold mb-4">Change Owner Password</h3>
            <form onSubmit={handleChangePassword}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter new password (min 6 characters)"
                  required
                  minLength={6}
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setNewPassword('')
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {restaurant.description && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Description</h2>
          <p className="text-gray-700">{restaurant.description}</p>
        </div>
      )}
    </div>
  )
}

