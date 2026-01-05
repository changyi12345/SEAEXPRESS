import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import axios from 'axios'
import Toast from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { socket } = useSocket()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: '', status: null })

  useEffect(() => {
    fetchOrder()
  }, [id])

  // Real-time order updates via Socket.io
  useEffect(() => {
    if (!socket || !id) return

    const handleOrderUpdate = (updatedOrder) => {
      if (updatedOrder._id === id) {
        setOrder(updatedOrder)
      }
    }

    socket.on('order-updated', handleOrderUpdate)
    socket.emit('join-room', `order-${id}`)

    return () => {
      socket.off('order-updated', handleOrderUpdate)
      socket.emit('leave-room', `order-${id}`)
    }
  }, [socket, id])

  const fetchOrder = async () => {
    try {
      const res = await axios.get(`/restaurant-owners/my-restaurant/orders`)
      const foundOrder = res.data.orders.find(o => o._id === id)
      if (foundOrder) {
        setOrder(foundOrder)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (status) => {
    try {
      await axios.put(`/restaurant-owners/my-restaurant/orders/${id}/status`, { status })
      fetchOrder()
      setToast({ message: 'Order status updated successfully', type: 'success' })
    } catch (error) {
      console.error('Error updating order status:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Error updating order status'
      setToast({ message: errorMessage, type: 'error' })
    }
  }

  const updatePaymentStatus = async (paymentStatus) => {
    try {
      await axios.put(`/restaurant-owners/my-restaurant/orders/${id}/payment`, { paymentStatus })
      fetchOrder()
      setToast({ message: 'Payment status updated successfully', type: 'success' })
    } catch (error) {
      console.error('Error updating payment status:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Error updating payment status'
      setToast({ message: errorMessage, type: 'error' })
    }
  }

  const handleRejectClick = () => {
    setConfirmModal({
      isOpen: true,
      action: 'reject',
      status: 'cancelled',
      title: 'Reject Order',
      message: 'Are you sure you want to reject this order? This action cannot be undone.'
    })
  }

  const handleCancelClick = () => {
    setConfirmModal({
      isOpen: true,
      action: 'cancel',
      status: 'cancelled',
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order? This action cannot be undone.'
    })
  }

  const handleConfirm = () => {
    if (confirmModal.status) {
      updateOrderStatus(confirmModal.status)
    }
  }

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPaymentMethodName = (method) => {
    const names = {
      cod: 'Cash on Delivery',
      kbzpay: 'KBZ Pay',
      wavemoney: 'Wave Money',
      bank: 'Bank Transfer'
    }
    return names[method] || method
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
          <button
            onClick={() => navigate('/orders')}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition"
          >
            Back to Orders
          </button>
        </div>
      </div>
    )
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
        onClose={() => setConfirmModal({ isOpen: false, action: '', status: null })}
        onConfirm={handleConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.action === 'reject' ? 'Reject Order' : 'Cancel Order'}
        cancelText="Cancel"
        type="danger"
      />
      <div className="mb-6">
        <button
          onClick={() => navigate('/orders')}
          className="text-primary hover:underline mb-4"
        >
          ← Back to Orders
        </button>
        <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Order Details</h2>
          <div className="space-y-2">
            <p><span className="font-semibold">Status:</span> 
              <span className="ml-2 px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                {order.status}
              </span>
            </p>
            <p><span className="font-semibold">Customer:</span> {order.user?.name}</p>
            <p><span className="font-semibold">Phone:</span> {order.user?.phone}</p>
            <p><span className="font-semibold">Email:</span> {order.user?.email}</p>
            <p><span className="font-semibold">Payment Method:</span> {getPaymentMethodName(order.paymentMethod)}</p>
            <p><span className="font-semibold">Payment Status:</span>
              <span className={`ml-2 px-2 py-1 rounded text-sm ${getPaymentStatusColor(order.paymentStatus)}`}>
                {order.paymentStatus}
              </span>
            </p>
            {order.transactionId && (
              <p><span className="font-semibold">Transaction ID:</span> 
                <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">{order.transactionId}</span>
              </p>
            )}
            <p><span className="font-semibold">Total Amount:</span> {order.total} Ks</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Items</h2>
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{item.name} x {item.quantity}</span>
                <span>{item.price * item.quantity} Ks</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{order.subtotal} Ks</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee:</span>
                <span>{order.deliveryFee} Ks</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>{order.total} Ks</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Update Order Status</h2>
        <div className="space-x-2">
          {order.status === 'pending' && (
            <>
              <button
                onClick={() => updateOrderStatus('preparing')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                ✓ Accept Order
              </button>
              <button
                onClick={handleRejectClick}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                ✗ Reject Order
              </button>
            </>
          )}
          {order.status === 'preparing' && !order.rider && (
            <button
              onClick={() => {
                handleCancelClick()
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              ✗ Cancel Order
            </button>
          )}
          {order.status === 'rider-assigned' && order.rider && (
            <button
              onClick={() => updateOrderStatus('picking-up')}
              className="bg-secondary text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              Ready for Pickup
            </button>
          )}
        </div>
      </div>

      {/* Payment Status Section */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">💳 Payment Management</h2>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-semibold">{getPaymentMethodName(order.paymentMethod)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Status</p>
                <span className={`px-3 py-1 rounded text-sm font-semibold ${getPaymentStatusColor(order.paymentStatus)}`}>
                  {order.paymentStatus.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-semibold text-lg">{order.total} Ks</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subtotal</p>
                <p className="font-semibold">{order.subtotal} Ks</p>
              </div>
            </div>
          </div>

          {/* Payment Status Update Buttons */}
          {order.paymentStatus !== 'paid' && order.paymentMethod !== 'cod' && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-3">Mark payment as received:</p>
              <div className="space-x-2">
                <button
                  onClick={() => updatePaymentStatus('paid')}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                >
                  ✓ Mark as Paid
                </button>
                <button
                  onClick={() => updatePaymentStatus('failed')}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                >
                  ✗ Mark as Failed
                </button>
              </div>
            </div>
          )}

          {order.paymentMethod === 'cod' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Cash on Delivery:</strong> Payment will be automatically marked as paid when the order is delivered.
              </p>
            </div>
          )}

          {order.paymentStatus === 'paid' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>✓ Payment Received:</strong> This order has been paid.
              </p>
            </div>
          )}

          {order.paymentStatus === 'failed' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>✗ Payment Failed:</strong> You can mark it as paid once payment is received.
              </p>
              <button
                onClick={() => updatePaymentStatus('paid')}
                className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition text-sm"
              >
                Mark as Paid Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Proof Images Section */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">📸 Proof Images (Rider Uploaded)</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-primary">
              Proof of Pickup (ပစ္စည်းယူထားတဲ့ပုံ)
            </h3>
            {order.proofOfPickup ? (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={order.proofOfPickup}
                    alt="Proof of Pickup"
                    className="w-full h-64 object-cover cursor-pointer hover:opacity-90 transition"
                    onClick={() => window.open(order.proofOfPickup, '_blank')}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Uploaded by rider when picking up the order
                </p>
              </>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-500">No image uploaded yet</p>
                <p className="text-sm text-gray-400 mt-2">Image will appear here once rider uploads it</p>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-accent">
              Proof of Delivery (လက်ခံထားတဲ့ပုံ)
            </h3>
            {order.proofOfDelivery ? (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={order.proofOfDelivery}
                    alt="Proof of Delivery"
                    className="w-full h-64 object-cover cursor-pointer hover:opacity-90 transition"
                    onClick={() => window.open(order.proofOfDelivery, '_blank')}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Uploaded by rider when delivering the order
                </p>
              </>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-500">No image uploaded yet</p>
                <p className="text-sm text-gray-400 mt-2">Image will appear here once rider uploads it</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delivery Address Section */}
      {order.deliveryAddress && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">📍 Delivery Address</h2>
          <div className="space-y-2">
            <p><span className="font-semibold">Name:</span> {order.deliveryAddress.name}</p>
            <p><span className="font-semibold">Phone:</span> {order.deliveryAddress.phone}</p>
            <p><span className="font-semibold">Address:</span> {order.deliveryAddress.street}</p>
            <p>
              <span className="font-semibold">Location:</span>{' '}
              {order.deliveryAddress.township}, {order.deliveryAddress.zone}, {order.deliveryAddress.city}
            </p>
            {order.deliveryAddress.notes && (
              <p><span className="font-semibold">Notes:</span> {order.deliveryAddress.notes}</p>
            )}
          </div>
        </div>
      )}

      {/* Rider Information */}
      {order.rider && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🚴 Rider Information</h2>
          <div className="space-y-2">
            <p><span className="font-semibold">Name:</span> {order.rider.name || 'N/A'}</p>
            <p><span className="font-semibold">Phone:</span> {order.rider.phone || 'N/A'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

