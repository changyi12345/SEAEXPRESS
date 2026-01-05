import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import ImageUpload from '../components/ImageUpload'
import ConfirmModal from '../components/ConfirmModal'

export default function Profile() {
  const { user, fetchUser } = useAuth()
  const [shop, setShop] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    nameMyanmar: '',
    phone: '',
    email: '',
    profileImage: null,
    address: {
      street: '',
      city: '',
      township: '',
      zone: ''
    },
    openingHours: {
      open: '',
      close: '',
      days: []
    },
    paymentAccounts: {
      kbzpay: {
        accountName: '',
        accountNumber: '',
        phone: ''
      },
      wavemoney: {
        accountName: '',
        accountNumber: '',
        phone: ''
      },
      bank: {
        accountName: '',
        accountNumber: '',
        bankName: '',
        branch: ''
      }
    }
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [promotions, setPromotions] = useState([])
  const [closingDays, setClosingDays] = useState([])
  const [showPromotionForm, setShowPromotionForm] = useState(false)
  const [showClosingDayForm, setShowClosingDayForm] = useState(false)
  const [promotionForm, setPromotionForm] = useState({
    title: '',
    titleMyanmar: '',
    description: '',
    descriptionMyanmar: '',
    discountPercentage: '',
    startDate: '',
    endDate: ''
  })
  const [closingDayForm, setClosingDayForm] = useState({
    date: '',
    reason: '',
    reasonMyanmar: ''
  })
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, id: null })

  useEffect(() => {
    fetchShop()
  }, [])

  const fetchShop = async () => {
    try {
      const res = await axios.get('/shop-owners/my-shop')
      const shopData = res.data.shop
      setShop(shopData)
      setPromotions(shopData.promotions || [])
      setClosingDays(shopData.closingDays || [])
      setFormData({
        name: shopData.name || '',
        nameMyanmar: shopData.nameMyanmar || '',
        phone: shopData.phone || '',
        email: shopData.email || '',
        profileImage: shopData.profileImage || null,
        address: shopData.address || {
          street: '',
          city: '',
          township: '',
          zone: ''
        },
        openingHours: shopData.openingHours || {
          open: '',
          close: '',
          days: []
        },
        paymentAccounts: shopData.paymentAccounts || {
          kbzpay: {
            accountName: '',
            accountNumber: '',
            phone: ''
          },
          wavemoney: {
            accountName: '',
            accountNumber: '',
            phone: ''
          },
          bank: {
            accountName: '',
            accountNumber: '',
            bankName: '',
            branch: ''
          }
        }
      })
    } catch (error) {
      console.error('Error fetching shop:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await axios.put('/shop-owners/my-shop', formData)
      setMessage('Shop updated successfully!')
      fetchShop()
    } catch (error) {
      setMessage('Error updating shop')
      console.error('Error updating shop:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!shop) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Shop Found</h2>
          <p className="text-gray-600">Please contact admin to set up your shop.</p>
        </div>
      </div>
    )
  }

  const handleAvatarUpload = async (imageUrl) => {
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
      console.error('Error updating avatar:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPromotion = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const res = await axios.post('/shop-owners/my-shop/promotions', promotionForm)
      setPromotions(res.data.shop.promotions)
      setPromotionForm({
        title: '',
        titleMyanmar: '',
        description: '',
        descriptionMyanmar: '',
        discountPercentage: '',
        startDate: '',
        endDate: ''
      })
      setShowPromotionForm(false)
      setMessage('Promotion added successfully! Users will be notified.')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to add promotion')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePromotion = async (promotionId) => {
    setConfirmModal({
      isOpen: true,
      action: 'deletePromotion',
      id: promotionId,
      title: 'Delete Promotion',
      message: 'Are you sure you want to delete this promotion?'
    })
  }

  const confirmDeletePromotion = async () => {
    setLoading(true)
    try {
      const res = await axios.delete(`/shop-owners/my-shop/promotions/${confirmModal.id}`)
      setPromotions(res.data.shop.promotions)
      setMessage('Promotion deleted successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Failed to delete promotion')
    } finally {
      setLoading(false)
      setConfirmModal({ isOpen: false, action: null, id: null })
    }
  }

  const handleAddClosingDay = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const res = await axios.post('/shop-owners/my-shop/closing-days', closingDayForm)
      setClosingDays(res.data.shop.closingDays)
      setClosingDayForm({ date: '', reason: '', reasonMyanmar: '' })
      setShowClosingDayForm(false)
      setMessage('Closing day added successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to add closing day')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClosingDay = async (closingDayId) => {
    setConfirmModal({
      isOpen: true,
      action: 'deleteClosingDay',
      id: closingDayId,
      title: 'Delete Closing Day',
      message: 'Are you sure you want to delete this closing day?'
    })
  }

  const confirmDeleteClosingDay = async () => {
    setLoading(true)
    try {
      const res = await axios.delete(`/shop-owners/my-shop/closing-days/${confirmModal.id}`)
      setClosingDays(res.data.shop.closingDays)
      setMessage('Closing day deleted successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Failed to delete closing day')
    } finally {
      setLoading(false)
      setConfirmModal({ isOpen: false, action: null, id: null })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Shop Profile</h1>

      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* User Avatar Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">👤 Your Profile Picture</h2>
        <p className="text-sm text-gray-600 mb-4">This image will be displayed in the navbar</p>
        <div className="flex items-center space-x-6">
          {user?.avatar ? (
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-primary shadow-lg"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold border-4 border-primary shadow-lg">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
          )}
          <div className="flex-1">
            <ImageUpload
              label=""
              existingImage={user?.avatar}
              onUpload={handleAvatarUpload}
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Profile Image Upload */}
        <div className="border-b pb-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📷 Shop Profile Image</h2>
          <ImageUpload
            label="Upload or Change Shop Profile Image"
            existingImage={formData.profileImage}
            onUpload={(imageUrl) => setFormData({ ...formData, profileImage: imageUrl })}
          />
          <p className="text-sm text-gray-600 mt-2">This image will be displayed to customers when they browse shops</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-semibold">Shop Name (English)</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold">Shop Name (Myanmar)</label>
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

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-semibold">Opening Time</label>
            <input
              type="time"
              value={formData.openingHours.open}
              onChange={(e) => setFormData({
                ...formData,
                openingHours: { ...formData.openingHours, open: e.target.value }
              })}
              className="w-full px-4 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold">Closing Time</label>
            <input
              type="time"
              value={formData.openingHours.close}
              onChange={(e) => setFormData({
                ...formData,
                openingHours: { ...formData.openingHours, close: e.target.value }
              })}
              className="w-full px-4 py-2 border rounded"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 font-semibold">Status: {shop.isApproved ? 'Approved' : 'Pending Approval'}</p>
        </div>

        {/* Payment Accounts Section */}
        <div className="border-t pt-6 mt-6">
          <h2 className="text-2xl font-bold mb-4">💳 Payment Accounts</h2>
          <p className="text-sm text-gray-600 mb-4">Add your payment account details so customers can pay you directly</p>

          {/* KBZ Pay */}
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold mb-3 text-lg">KBZ Pay</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block mb-2 text-sm font-semibold">Account Name</label>
                <input
                  type="text"
                  value={formData.paymentAccounts.kbzpay.accountName}
                  onChange={(e) => setFormData({
                    ...formData,
                    paymentAccounts: {
                      ...formData.paymentAccounts,
                      kbzpay: { ...formData.paymentAccounts.kbzpay, accountName: e.target.value }
                    }
                  })}
                  className="w-full px-4 py-2 border rounded"
                  placeholder="Account holder name"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold">Account Number</label>
                <input
                  type="text"
                  value={formData.paymentAccounts.kbzpay.accountNumber}
                  onChange={(e) => setFormData({
                    ...formData,
                    paymentAccounts: {
                      ...formData.paymentAccounts,
                      kbzpay: { ...formData.paymentAccounts.kbzpay, accountNumber: e.target.value }
                    }
                  })}
                  className="w-full px-4 py-2 border rounded"
                  placeholder="Account number"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold">Phone Number</label>
                <input
                  type="text"
                  value={formData.paymentAccounts.kbzpay.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    paymentAccounts: {
                      ...formData.paymentAccounts,
                      kbzpay: { ...formData.paymentAccounts.kbzpay, phone: e.target.value }
                    }
                  })}
                  className="w-full px-4 py-2 border rounded"
                  placeholder="Phone number"
                />
              </div>
            </div>
          </div>

          {/* Wave Money */}
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold mb-3 text-lg">Wave Money</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block mb-2 text-sm font-semibold">Account Name</label>
                <input
                  type="text"
                  value={formData.paymentAccounts.wavemoney.accountName}
                  onChange={(e) => setFormData({
                    ...formData,
                    paymentAccounts: {
                      ...formData.paymentAccounts,
                      wavemoney: { ...formData.paymentAccounts.wavemoney, accountName: e.target.value }
                    }
                  })}
                  className="w-full px-4 py-2 border rounded"
                  placeholder="Account holder name"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold">Phone Number</label>
                <input
                  type="text"
                  value={formData.paymentAccounts.wavemoney.phone || formData.paymentAccounts.wavemoney.accountNumber}
                  onChange={(e) => setFormData({
                    ...formData,
                    paymentAccounts: {
                      ...formData.paymentAccounts,
                      wavemoney: { ...formData.paymentAccounts.wavemoney, phone: e.target.value, accountNumber: e.target.value }
                    }
                  })}
                  className="w-full px-4 py-2 border rounded"
                  placeholder="Phone number"
                />
              </div>
            </div>
          </div>

          {/* Bank Transfer */}
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold mb-3 text-lg">Bank Transfer</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-semibold">Account Name</label>
                <input
                  type="text"
                  value={formData.paymentAccounts.bank.accountName}
                  onChange={(e) => setFormData({
                    ...formData,
                    paymentAccounts: {
                      ...formData.paymentAccounts,
                      bank: { ...formData.paymentAccounts.bank, accountName: e.target.value }
                    }
                  })}
                  className="w-full px-4 py-2 border rounded"
                  placeholder="Account holder name"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold">Account Number</label>
                <input
                  type="text"
                  value={formData.paymentAccounts.bank.accountNumber}
                  onChange={(e) => setFormData({
                    ...formData,
                    paymentAccounts: {
                      ...formData.paymentAccounts,
                      bank: { ...formData.paymentAccounts.bank, accountNumber: e.target.value }
                    }
                  })}
                  className="w-full px-4 py-2 border rounded"
                  placeholder="Account number"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold">Bank Name</label>
                <input
                  type="text"
                  value={formData.paymentAccounts.bank.bankName}
                  onChange={(e) => setFormData({
                    ...formData,
                    paymentAccounts: {
                      ...formData.paymentAccounts,
                      bank: { ...formData.paymentAccounts.bank, bankName: e.target.value }
                    }
                  })}
                  className="w-full px-4 py-2 border rounded"
                  placeholder="Bank name"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold">Branch</label>
                <input
                  type="text"
                  value={formData.paymentAccounts.bank.branch}
                  onChange={(e) => setFormData({
                    ...formData,
                    paymentAccounts: {
                      ...formData.paymentAccounts,
                      bank: { ...formData.paymentAccounts.bank, branch: e.target.value }
                    }
                  })}
                  className="w-full px-4 py-2 border rounded"
                  placeholder="Branch name"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Shop'}
        </button>
      </form>

      {/* Promotions Section */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">🎉 Promotions & Discounts</h2>
          <button
            onClick={() => setShowPromotionForm(!showPromotionForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            {showPromotionForm ? 'Cancel' : '+ Add Promotion'}
          </button>
        </div>

        {showPromotionForm && (
          <form onSubmit={handleAddPromotion} className="mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-2 font-semibold">Title (English) *</label>
                <input
                  type="text"
                  value={promotionForm.title}
                  onChange={(e) => setPromotionForm({ ...promotionForm, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">Title (Myanmar)</label>
                <input
                  type="text"
                  value={promotionForm.titleMyanmar}
                  onChange={(e) => setPromotionForm({ ...promotionForm, titleMyanmar: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">Description (English)</label>
                <textarea
                  value={promotionForm.description}
                  onChange={(e) => setPromotionForm({ ...promotionForm, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  rows="2"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">Description (Myanmar)</label>
                <textarea
                  value={promotionForm.descriptionMyanmar}
                  onChange={(e) => setPromotionForm({ ...promotionForm, descriptionMyanmar: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  rows="2"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">Discount Percentage (%) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={promotionForm.discountPercentage}
                  onChange={(e) => setPromotionForm({ ...promotionForm, discountPercentage: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">Start Date *</label>
                <input
                  type="datetime-local"
                  value={promotionForm.startDate}
                  onChange={(e) => setPromotionForm({ ...promotionForm, startDate: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">End Date *</label>
                <input
                  type="datetime-local"
                  value={promotionForm.endDate}
                  onChange={(e) => setPromotionForm({ ...promotionForm, endDate: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Promotion'}
            </button>
          </form>
        )}

        <div className="space-y-4">
          {promotions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No promotions yet</p>
          ) : (
            promotions.map((promo) => {
              const now = new Date()
              const startDate = new Date(promo.startDate)
              const endDate = new Date(promo.endDate)
              const isActive = promo.isActive && now >= startDate && now <= endDate
              
              return (
                <div key={promo._id} className={`p-4 border rounded-lg ${isActive ? 'bg-green-50 border-green-300' : 'bg-gray-50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{promo.title}</h3>
                        <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                          {promo.discountPercentage}% OFF
                        </span>
                        {isActive && (
                          <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">Active</span>
                        )}
                      </div>
                      {promo.titleMyanmar && <p className="text-gray-600 mb-1">{promo.titleMyanmar}</p>}
                      {promo.description && <p className="text-sm text-gray-600 mb-2">{promo.description}</p>}
                      <p className="text-xs text-gray-500">
                        {new Date(promo.startDate).toLocaleString()} - {new Date(promo.endDate).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeletePromotion(promo._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Closing Days Section */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">🚫 Closing Days</h2>
          <button
            onClick={() => setShowClosingDayForm(!showClosingDayForm)}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
          >
            {showClosingDayForm ? 'Cancel' : '+ Add Closing Day'}
          </button>
        </div>

        {showClosingDayForm && (
          <form onSubmit={handleAddClosingDay} className="mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block mb-2 font-semibold">Date *</label>
                <input
                  type="date"
                  value={closingDayForm.date}
                  onChange={(e) => setClosingDayForm({ ...closingDayForm, date: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">Reason (English)</label>
                <input
                  type="text"
                  value={closingDayForm.reason}
                  onChange={(e) => setClosingDayForm({ ...closingDayForm, reason: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  placeholder="e.g., Holiday, Maintenance"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold">Reason (Myanmar)</label>
                <input
                  type="text"
                  value={closingDayForm.reasonMyanmar}
                  onChange={(e) => setClosingDayForm({ ...closingDayForm, reasonMyanmar: e.target.value })}
                  className="w-full px-4 py-2 border rounded"
                  placeholder="e.g., ပိတ်ရက်, ပြုပြင်ထိန်းသိမ်းမှု"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Closing Day'}
            </button>
          </form>
        )}

        <div className="space-y-2">
          {closingDays.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No closing days set</p>
          ) : (
            closingDays.map((day) => (
              <div key={day._id} className="p-3 border rounded-lg bg-red-50 border-red-200 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{new Date(day.date).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">{day.reason || 'Closed'}</p>
                  {day.reasonMyanmar && <p className="text-sm text-gray-600">{day.reasonMyanmar}</p>}
                </div>
                <button
                  onClick={() => handleDeleteClosingDay(day._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-sm"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: null, id: null })}
        onConfirm={() => {
          if (confirmModal.action === 'deletePromotion') {
            confirmDeletePromotion()
          } else if (confirmModal.action === 'deleteClosingDay') {
            confirmDeleteClosingDay()
          }
        }}
        title={confirmModal.title || 'Confirm Action'}
        message={confirmModal.message || 'Are you sure?'}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
}

