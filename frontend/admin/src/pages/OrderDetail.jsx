import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import Toast from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false })

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrder()
      const interval = setInterval(fetchOrder, 5000) // Refresh every 5 seconds
      return () => clearInterval(interval)
    }
  }, [id, isAuthenticated])

  const fetchOrder = async () => {
    try {
      const res = await axios.get(`/admin/orders/${id}`)
      if (res.data.order) {
        setOrder(res.data.order)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      console.error('Error response:', error.response?.data)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (newStatus) => {
    try {
      await axios.patch(`/orders/${id}/status`, { status: newStatus })
      fetchOrder()
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to update status', type: 'error' })
    }
  }

  const verifyRiderPayment = async (verified) => {
    try {
      await axios.put(`/admin/orders/${id}/verify-rider-payment`, { verified })
      fetchOrder()
      setToast({ message: verified ? 'Transaction ID verified successfully' : 'Transaction ID verification failed', type: verified ? 'success' : 'error' })
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to verify transaction ID', type: 'error' })
    }
  }

  const handleConfirmDeliveryClick = () => {
    setConfirmModal({
      isOpen: true,
      action: 'confirm-delivery'
    })
  }

  const confirmDelivery = async () => {
    try {
      await axios.put(`/admin/orders/${id}/confirm-delivery`)
      fetchOrder()
      setToast({ message: 'Delivery confirmed and rider service fee paid', type: 'success' })
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to confirm delivery', type: 'error' })
    }
  }

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  if (!order) {
    return <div className="container mx-auto px-4 py-8 text-center">Order not found</div>
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

  return (
    <div className="container mx-auto px-4 py-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false })}
        onConfirm={confirmDelivery}
        title="Confirm Delivery & Pay Rider"
        message={`Confirm delivery and pay rider service fee of ${order?.riderServiceFee || (order?.deliveryFee ? Math.round(order.deliveryFee * 0.8) : 0)} Ks?`}
        confirmText="Confirm & Pay"
        cancelText="Cancel"
        type="danger"
      />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
        <button
          onClick={() => navigate('/orders')}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
        >
          Back to Orders
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            <div className="space-y-2">
              <p><strong>Status:</strong> <span className={`px-2 py-1 rounded text-sm ${getStatusColor(order.status)}`}>{getStatusText(order.status)}</span></p>
              <p><strong>Order Type:</strong> {order.orderType === 'user-to-user' ? 'User-to-User Delivery' : (order.restaurant ? 'Restaurant' : 'Shop')}</p>
              {order.restaurant && <p><strong>Restaurant:</strong> {order.restaurant.name}</p>}
              {order.shop && <p><strong>Shop:</strong> {order.shop.name}</p>}
              <p><strong>Total:</strong> <span className="text-primary font-bold">{order.total} Ks</span></p>
              <p><strong>Delivery Fee:</strong> {order.deliveryFee} Ks</p>
              <p><strong>Payment Method:</strong> {order.paymentMethod.toUpperCase()}</p>
              <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            <div className="space-y-2">
              <p><strong>Name:</strong> {order.user?.name}</p>
              <p><strong>Phone:</strong> 
                <button
                  onClick={() => handleCall(order.user?.phone)}
                  className="ml-2 bg-secondary text-white px-3 py-1 rounded hover:bg-blue-600 transition text-sm"
                >
                  Call
                </button>
              </p>
              <p><strong>Email:</strong> {order.user?.email}</p>
            </div>
          </div>

          {order.orderType === 'user-to-user' && order.pickupAddress && (
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-primary">
              <h2 className="text-xl font-semibold mb-4 text-primary">📍 Pickup Location (ယူရမည့်နေရာ)</h2>
              <div className="space-y-2">
                <p><strong>From:</strong> {order.pickupAddress.name}</p>
                <p>{order.pickupAddress.street}</p>
                <p>{order.pickupAddress.township}, {order.pickupAddress.zone}</p>
                <p>Phone: 
                  <button
                    onClick={() => handleCall(order.pickupAddress.phone)}
                    className="ml-2 bg-primary text-white px-3 py-1 rounded hover:bg-primary-dark transition text-sm"
                  >
                    Call
                  </button>
                </p>
                {order.pickupAddress.notes && (
                  <p className="text-sm text-gray-600 mt-2">Notes: {order.pickupAddress.notes}</p>
                )}
                {order.proofOfPickup && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold mb-2">📸 Proof of Pickup:</p>
                    <img
                      src={order.proofOfPickup}
                      alt="Proof of Pickup"
                      className="w-full max-w-md h-48 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-accent">
            <h2 className="text-xl font-semibold mb-4 text-accent">🚚 Delivery Location (ပို့ပေးရမည့်နေရာ)</h2>
            {order.orderType === 'user-to-user' && order.deliveryAddress?.name && (
              <p><strong>To:</strong> {order.deliveryAddress.name}</p>
            )}
            <p>{order.deliveryAddress?.street}</p>
            <p>{order.deliveryAddress?.township}, {order.deliveryAddress?.zone}</p>
            <p>Phone: 
              <button
                onClick={() => handleCall(order.deliveryAddress?.phone)}
                className="ml-2 bg-accent text-white px-3 py-1 rounded hover:bg-green-600 transition text-sm"
              >
                Call
              </button>
            </p>
            {order.deliveryAddress?.notes && (
              <p className="text-sm text-gray-600 mt-2">Notes: {order.deliveryAddress.notes}</p>
            )}
            {order.proofOfDelivery && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">📸 Proof of Delivery:</p>
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

          {order.rider && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Rider Information</h2>
              <div className="space-y-2">
                <p><strong>Name:</strong> {order.rider.name}</p>
                <p><strong>Phone:</strong> 
                  <button
                    onClick={() => handleCall(order.rider.phone)}
                    className="ml-2 bg-secondary text-white px-3 py-1 rounded hover:bg-blue-600 transition text-sm"
                  >
                    Call
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Restaurant/Shop Payment Status */}
          {order.orderType !== 'user-to-user' && (
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <h2 className="text-xl font-semibold mb-4">💳 Restaurant/Shop Payment</h2>
              <div className="space-y-2">
                <p><strong>Delivery Fee Payment Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    order.restaurantShopPaymentStatus === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.restaurantShopPaymentStatus === 'paid' ? '✓ Paid' : 'Pending'}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Delivery fee: <span className="font-semibold">{order.deliveryFee} Ks</span>
                </p>
                {order.restaurantShopPaymentStatus === 'paid' && (
                  <p className="text-xs text-green-600 mt-2">
                    ✓ Restaurant/Shop has paid the delivery fee when accepting the order
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Rider Payment to SEA EXPRESS */}
          {order.status === 'picked-up' && order.proofOfPickup && (
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <h2 className="text-xl font-semibold mb-4">💳 Rider Payment to SEA EXPRESS</h2>
              <div className="space-y-3">
                {order.riderPaymentTransactionId ? (
                  <>
                    <div>
                      <p><strong>Transaction ID:</strong> 
                        <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
                          {order.riderPaymentTransactionId}
                        </span>
                      </p>
                      <p className="mt-2"><strong>Status:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded text-sm ${
                          order.riderPaymentStatus === 'verified' 
                            ? 'bg-green-100 text-green-800'
                            : order.riderPaymentStatus === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.riderPaymentStatus === 'verified' && '✓ Verified'}
                          {order.riderPaymentStatus === 'failed' && '✗ Failed'}
                          {order.riderPaymentStatus === 'pending' && '⏳ Pending Verification'}
                        </span>
                      </p>
                    </div>
                    {order.riderPaymentStatus === 'pending' && (
                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => verifyRiderPayment(true)}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                        >
                          ✓ Verify Transaction ID
                        </button>
                        <button
                          onClick={() => verifyRiderPayment(false)}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                        >
                          ✗ Reject Transaction ID
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-sm text-yellow-800">
                      ⏳ Waiting for rider to submit transaction ID after pickup
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delivery Confirmation & Rider Service Fee */}
          {order.status === 'delivered' && order.proofOfDelivery && order.riderPaymentStatus === 'verified' && (
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <h2 className="text-xl font-semibold mb-4">✅ Confirm Delivery & Pay Rider</h2>
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm font-semibold mb-2">Requirements Met:</p>
                  <ul className="text-sm space-y-1">
                    <li>✓ Proof of delivery uploaded</li>
                    <li>✓ Rider payment transaction ID verified</li>
                    <li>✓ Order delivered</li>
                  </ul>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm"><strong>Rider Service Fee:</strong> 
                    <span className="ml-2 text-lg font-bold text-primary">
                      {order.riderServiceFee || Math.round(order.deliveryFee * 0.8)} Ks
                    </span>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    (80% of delivery fee: {order.deliveryFee} Ks)
                  </p>
                </div>
                {order.riderServiceFeeStatus === 'paid' ? (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-sm text-green-800 font-semibold">
                      ✓ Delivery confirmed and rider service fee paid
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Order status: <span className="font-semibold">{getStatusText(order.status)}</span>
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleConfirmDeliveryClick}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition font-semibold"
                  >
                    ✅ Confirm Delivery & Pay Rider Service Fee
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2">
              {order.subtotal > 0 && (
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{order.subtotal} Ks</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{order.deliveryFee} Ks</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">{order.total} Ks</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Order Timeline</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Created:</strong> {new Date(order.createdAt).toLocaleString()}</p>
              {order.deliveredAt && (
                <p><strong>Delivered:</strong> {new Date(order.deliveredAt).toLocaleString()}</p>
              )}
            </div>
          </div>

          {order.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-2">Notes</h2>
              <p className="text-gray-700">{order.notes}</p>
            </div>
          )}

          {order.rating && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-2">Rating & Review</h2>
              <div className="flex items-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={`text-2xl ${star <= order.rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                    ⭐
                  </span>
                ))}
              </div>
              {order.review && <p className="text-gray-700">{order.review}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

