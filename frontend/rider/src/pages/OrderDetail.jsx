import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import ImageUpload from '../components/ImageUpload'
import Toast from '../components/Toast'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState(null)
  const [showPickupProof, setShowPickupProof] = useState(false)
  const [showDeliveryProof, setShowDeliveryProof] = useState(false)
  const [pickupProof, setPickupProof] = useState(null)
  const [deliveryProof, setDeliveryProof] = useState(null)
  const [showTransactionId, setShowTransactionId] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [submittingTransaction, setSubmittingTransaction] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrder()
      startLocationTracking()
      const interval = setInterval(fetchOrder, 3000)
      return () => clearInterval(interval)
    }
  }, [id, isAuthenticated])

  const fetchOrder = async () => {
    try {
      const res = await axios.get(`/riders/orders`)
      const foundOrder = res.data.orders.find(o => o._id === id)
      if (foundOrder) {
        setOrder(foundOrder)
        // Set existing proof images if available
        if (foundOrder.proofOfPickup) {
          setPickupProof(foundOrder.proofOfPickup)
        }
        if (foundOrder.proofOfDelivery) {
          setDeliveryProof(foundOrder.proofOfDelivery)
        }
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  const startLocationTracking = () => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setLocation({ lat: latitude, lng: longitude })
          updateLocation(latitude, longitude)
        },
        (error) => {
          console.error('Geolocation error:', error)
        },
        { enableHighAccuracy: true }
      )
    }
  }

  const updateLocation = async (lat, lng) => {
    try {
      await axios.post('/riders/location', { lat, lng })
    } catch (error) {
      console.error('Error updating location:', error)
    }
  }

  const updateStatus = async (newStatus, proofImage = null) => {
    try {
      const data = { status: newStatus }
      if (proofImage) {
        if (newStatus === 'picked-up') {
          data.proofOfPickup = proofImage
        } else if (newStatus === 'delivered') {
          data.proofOfDelivery = proofImage
        }
      }
      await axios.patch(`/orders/${id}/status`, data)
      fetchOrder()
      setShowPickupProof(false)
      setShowDeliveryProof(false)
      setPickupProof(null)
      setDeliveryProof(null)
      setToast({ message: 'Status updated successfully', type: 'success' })
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to update status', type: 'error' })
    }
  }

  const handlePickupProofUpload = (imageUrl) => {
    setPickupProof(imageUrl)
  }

  const handleDeliveryProofUpload = (imageUrl) => {
    setDeliveryProof(imageUrl)
  }

  const handleMarkPickedUp = async () => {
    if (!pickupProof) {
      setToast({ message: 'Please upload proof of pickup image', type: 'error' })
      return
    }
    await updateStatus('picked-up', pickupProof)
    // After pickup, show transaction ID input
    if (order && order.deliveryFee) {
      setShowTransactionId(true)
    }
  }

  const handleSubmitTransactionId = async () => {
    if (!transactionId || transactionId.length !== 6 || !/^\d{6}$/.test(transactionId)) {
      setToast({ message: 'Please enter a valid 6-digit transaction ID', type: 'error' })
      return
    }

    setSubmittingTransaction(true)
    try {
      await axios.post(`/riders/orders/${id}/payment`, { transactionId })
      setToast({ message: 'Transaction ID submitted successfully. Waiting for admin verification.', type: 'success' })
      setShowTransactionId(false)
      setTransactionId('')
      fetchOrder()
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to submit transaction ID'
      setToast({ message: errorMessage, type: 'error' })
    } finally {
      setSubmittingTransaction(false)
    }
  }

  const handleMarkDelivered = () => {
    if (!deliveryProof) {
      setToast({ message: 'Please upload proof of delivery image', type: 'error' })
      return
    }
    updateStatus('delivered', deliveryProof)
  }

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`
  }

  if (loading) {
    return <div className="container mx-auto px-3 sm:px-4 py-8 text-center">Loading...</div>
  }

  if (!order) {
    return <div className="container mx-auto px-3 sm:px-4 py-8 text-center">Order not found</div>
  }

  const canUpdateStatus = (status) => {
    const currentStatus = order.status
    const transitions = {
      'rider-assigned': ['picking-up'],
      'picking-up': ['picked-up'],
      'picked-up': ['delivering'],
      'delivering': ['delivered']
    }
    return transitions[currentStatus]?.includes(status) || false
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 md:py-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 md:mb-6">Order #{order.orderNumber}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-4 md:space-y-6">
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 md:mb-4">Order Details</h2>
            <div className="space-y-2">
              <p><strong>Status:</strong> <span className="text-primary">{order.status}</span></p>
              <p><strong>Order Type:</strong> {order.orderType === 'user-to-user' ? 'User-to-User Delivery' : (order.restaurant ? 'Restaurant' : 'Shop')}</p>
              {order.restaurant && <p><strong>Restaurant:</strong> {order.restaurant.name}</p>}
              {order.shop && <p><strong>Shop:</strong> {order.shop.name}</p>}
              <p><strong>Total:</strong> <span className="text-primary font-bold">{order.total} Ks</span></p>
              <p><strong>Delivery Fee:</strong> {order.deliveryFee} Ks (You get: {Math.round(order.deliveryFee * 0.8)} Ks)</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 md:mb-4">Customer Information</h2>
            <div className="space-y-2">
              <p><strong>Name:</strong> {order.user?.name}</p>
              <p><strong>Phone:</strong> 
                <button
                  onClick={() => handleCall(order.user?.phone)}
                  className="ml-2 bg-secondary text-white px-3 py-1.5 rounded hover:bg-blue-600 active:bg-blue-700 transition text-sm touch-manipulation"
                >
                  Call
                </button>
              </p>
            </div>
          </div>

          {(order.orderType === 'user-to-user' && order.pickupAddress) || (order.orderType !== 'user-to-user' && (order.restaurant || order.shop)) ? (
            <div className="bg-white rounded-lg shadow p-4 md:p-6 border-l-4 border-primary">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 md:mb-4 text-primary">📍 Pickup Location (ယူရမည့်နေရာ)</h2>
              <div className="space-y-2">
                {order.orderType === 'user-to-user' && order.pickupAddress ? (
                  <>
                    <p><strong>From:</strong> {order.pickupAddress.name}</p>
                    <p>{order.pickupAddress.street}</p>
                    <p>{order.pickupAddress.township}, {order.pickupAddress.zone}</p>
                    <p>Phone: 
                      <button
                        onClick={() => handleCall(order.pickupAddress.phone)}
                        className="ml-2 bg-primary text-white px-3 py-1.5 rounded hover:bg-primary-dark active:bg-primary-dark transition text-sm touch-manipulation"
                      >
                        Call
                      </button>
                    </p>
                    {order.pickupAddress.notes && (
                      <p className="text-sm text-gray-600 mt-2">Notes: {order.pickupAddress.notes}</p>
                    )}
                  </>
                ) : (
                  <>
                    <p><strong>From:</strong> {order.restaurant?.name || order.shop?.name}</p>
                    <p>{order.restaurant?.address?.street || order.shop?.address?.street}</p>
                    <p>{order.restaurant?.address?.township || order.shop?.address?.township}, {order.restaurant?.address?.zone || order.shop?.address?.zone}</p>
                    <p>Phone: 
                      <button
                        onClick={() => handleCall(order.restaurant?.phone || order.shop?.phone)}
                        className="ml-2 bg-primary text-white px-3 py-1.5 rounded hover:bg-primary-dark active:bg-primary-dark transition text-sm touch-manipulation"
                      >
                        Call
                      </button>
                    </p>
                  </>
                )}
                {order.proofOfPickup && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold mb-2">📸 Proof of Pickup (ပစ္စည်းယူထားတဲ့ပုံ):</p>
                    <img
                      src={order.proofOfPickup}
                      alt="Proof of Pickup"
                      className="w-full max-w-md h-48 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <div className="bg-white rounded-lg shadow p-4 md:p-6 border-l-4 border-accent">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 md:mb-4 text-accent">🚚 Delivery Location (ပို့ပေးရမည့်နေရာ)</h2>
            {order.orderType === 'user-to-user' && order.deliveryAddress?.name && (
              <p><strong>To:</strong> {order.deliveryAddress.name}</p>
            )}
            <p>{order.deliveryAddress?.street}</p>
            <p>{order.deliveryAddress?.township}, {order.deliveryAddress?.zone}</p>
            <p>Phone: 
              <button
                onClick={() => handleCall(order.deliveryAddress?.phone)}
                className="ml-2 bg-accent text-white px-3 py-1.5 rounded hover:bg-green-600 active:bg-green-700 transition text-sm touch-manipulation"
              >
                Call
              </button>
            </p>
            {order.deliveryAddress?.notes && (
              <p className="text-sm text-gray-600 mt-2">Notes: {order.deliveryAddress.notes}</p>
            )}
            {order.proofOfDelivery && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">📸 Proof of Delivery (လက်ခံထားတဲ့ပုံ):</p>
                <img
                  src={order.proofOfDelivery}
                  alt="Proof of Delivery"
                  className="w-full max-w-md h-48 object-cover rounded border"
                />
              </div>
            )}
          </div>

          {order.items && order.items.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Items</h2>
              {order.items.map((item, index) => (
                <div key={index} className="border-b pb-2 mb-2">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity} x {item.price} Ks</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-y-3">
              {canUpdateStatus('picking-up') && (
                <button
                  onClick={() => updateStatus('picking-up')}
                  className="w-full bg-indigo-500 text-white py-2 rounded hover:bg-indigo-600 transition font-semibold"
                >
                  📍 Start Picking Up
                </button>
              )}
              {canUpdateStatus('picked-up') && (
                <div className="space-y-3">
                  {!showPickupProof ? (
                    <button
                      onClick={() => setShowPickupProof(true)}
                      className="w-full bg-teal-500 text-white py-2 rounded hover:bg-teal-600 transition font-semibold"
                    >
                      ✅ Mark as Picked Up (Upload Proof)
                    </button>
                  ) : (
                    <div className="space-y-3 border p-4 rounded">
                      <ImageUpload
                        label="📸 Proof of Pickup (ပစ္စည်းယူထားတဲ့ပုံ)"
                        existingImage={order.proofOfPickup}
                        onUpload={handlePickupProofUpload}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleMarkPickedUp}
                          disabled={!pickupProof}
                          className="flex-1 bg-teal-500 text-white py-2 rounded hover:bg-teal-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Confirm Picked Up
                        </button>
                        <button
                          onClick={() => {
                            setShowPickupProof(false)
                            setPickupProof(null)
                          }}
                          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Transaction ID Input Section - After Pickup */}
              {order.status === 'picked-up' && order.proofOfPickup && !order.riderPaymentTransactionId && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-blue-900">💳 Pay Delivery Fee to SEA EXPRESS</h3>
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <p className="text-sm font-semibold mb-2">SEA EXPRESS Payment Account:</p>
                    <div className="text-sm space-y-1">
                      <p><span className="font-semibold">Account Name:</span> SEA EXPRESS</p>
                      <p><span className="font-semibold">KBZ Pay Phone:</span> 09447772848</p>
                      <p><span className="font-semibold">Wave Money Phone:</span> 09447772848</p>
                      <p className="mt-2 pt-2 border-t">
                        <span className="font-semibold">Amount to Pay:</span> 
                        <span className="ml-2 text-lg text-primary font-bold">{order.deliveryFee} Ks</span>
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Please transfer the delivery fee ({order.deliveryFee} Ks) to SEA EXPRESS account and enter the transaction ID below
                    </p>
                  </div>
                  {!showTransactionId ? (
                    <button
                      onClick={() => setShowTransactionId(true)}
                      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-semibold"
                    >
                      💳 Submit Transaction ID
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Transaction ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Enter 6-digit transaction ID"
                          value={transactionId}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                            setTransactionId(value)
                          }}
                          maxLength={6}
                          className="w-full px-4 py-2 border rounded"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter the 6-digit transaction ID from your payment receipt
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSubmitTransactionId}
                          disabled={!transactionId || transactionId.length !== 6 || submittingTransaction}
                          className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingTransaction ? 'Submitting...' : 'Submit Transaction ID'}
                        </button>
                        <button
                          onClick={() => {
                            setShowTransactionId(false)
                            setTransactionId('')
                          }}
                          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Transaction ID Status */}
              {order.riderPaymentTransactionId && (
                <div className={`p-4 rounded-lg ${
                  order.riderPaymentStatus === 'verified' 
                    ? 'bg-green-50 border border-green-300' 
                    : order.riderPaymentStatus === 'failed'
                    ? 'bg-red-50 border border-red-300'
                    : 'bg-yellow-50 border border-yellow-300'
                }`}>
                  <p className="font-semibold">
                    {order.riderPaymentStatus === 'verified' && '✓ Transaction ID Verified'}
                    {order.riderPaymentStatus === 'failed' && '✗ Transaction ID Verification Failed'}
                    {order.riderPaymentStatus === 'pending' && '⏳ Waiting for Admin Verification'}
                  </p>
                  <p className="text-sm mt-1">Transaction ID: <span className="font-mono">{order.riderPaymentTransactionId}</span></p>
                </div>
              )}

              {/* Rider Service Fee Status */}
              {order.status === 'delivered' && order.riderServiceFee > 0 && (
                <div className={`p-4 rounded-lg border-2 ${
                  order.riderServiceFeeStatus === 'paid'
                    ? 'bg-green-50 border-green-400'
                    : 'bg-blue-50 border-blue-300'
                }`}>
                  <h3 className="font-semibold mb-2">💰 Rider Service Fee</h3>
                  <p className="text-lg font-bold text-primary mb-2">
                    {order.riderServiceFee} Ks
                  </p>
                  {order.riderServiceFeeStatus === 'paid' ? (
                    <p className="text-sm text-green-700 font-semibold">
                      ✓ Service fee paid by SEA EXPRESS
                    </p>
                  ) : (
                    <p className="text-sm text-blue-700">
                      ⏳ Waiting for admin to confirm delivery and pay service fee
                    </p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    (80% of delivery fee: {order.deliveryFee} Ks)
                  </p>
                </div>
              )}

              {canUpdateStatus('delivering') && (
                <>
                  {order.orderType !== 'user-to-user' && order.riderPaymentStatus !== 'verified' ? (
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                      <p className="text-sm font-semibold text-yellow-800 mb-2">
                        ⚠️ Please wait for admin to verify your transaction ID
                      </p>
                      <p className="text-xs text-yellow-700">
                        You can only start delivering after admin verifies your payment transaction ID.
                      </p>
                      {!order.riderPaymentTransactionId && (
                        <p className="text-xs text-red-600 mt-2">
                          Please submit your transaction ID first.
                        </p>
                      )}
                      {order.riderPaymentTransactionId && order.riderPaymentStatus === 'pending' && (
                        <p className="text-xs text-blue-600 mt-2">
                          Transaction ID submitted. Waiting for admin verification...
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => updateStatus('delivering')}
                      className="w-full bg-secondary text-white py-2 rounded hover:bg-blue-600 transition font-semibold"
                    >
                      🚚 Start Delivering
                    </button>
                  )}
                </>
              )}
              {canUpdateStatus('delivered') && (
                <div className="space-y-3">
                  {!showDeliveryProof ? (
                    <button
                      onClick={() => setShowDeliveryProof(true)}
                      className="w-full bg-accent text-white py-2 rounded hover:bg-green-600 transition font-semibold"
                    >
                      ✅ Mark as Delivered (Upload Proof)
                    </button>
                  ) : (
                    <div className="space-y-3 border p-4 rounded">
                      <ImageUpload
                        label="📸 Proof of Delivery (လက်ခံထားတဲ့ပုံ)"
                        existingImage={order.proofOfDelivery}
                        onUpload={handleDeliveryProofUpload}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleMarkDelivered}
                          disabled={!deliveryProof}
                          className="flex-1 bg-accent text-white py-2 rounded hover:bg-green-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Confirm Delivered
                        </button>
                        <button
                          onClick={() => {
                            setShowDeliveryProof(false)
                            setDeliveryProof(null)
                          }}
                          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {location && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-2">Your Location</h2>
              <p className="text-sm text-gray-600">
                Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
              </p>
              <p className="text-xs text-green-600 mt-2">✓ Location tracking active</p>
            </div>
          )}

          {/* Proof Images Summary */}
          {(order.proofOfPickup || order.proofOfDelivery) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">📸 Proof Images</h2>
              <div className="space-y-4">
                {order.proofOfPickup && (
                  <div>
                    <p className="text-sm font-semibold mb-2 text-primary">Proof of Pickup (ပစ္စည်းယူထားတဲ့ပုံ):</p>
                    <img
                      src={order.proofOfPickup}
                      alt="Proof of Pickup"
                      className="w-full h-48 object-cover rounded border"
                    />
                  </div>
                )}
                {order.proofOfDelivery && (
                  <div>
                    <p className="text-sm font-semibold mb-2 text-accent">Proof of Delivery (လက်ခံထားတဲ့ပုံ):</p>
                    <img
                      src={order.proofOfDelivery}
                      alt="Proof of Delivery"
                      className="w-full h-48 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

