import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import axios from 'axios'
import Toast from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'
import { playOrderNotificationSound } from '../utils/soundNotification'

export default function Orders() {
  const { socket } = useSocket()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [toast, setToast] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, orderId: null, status: null, action: '' })
  const previousOrderIdsRef = useRef(new Set())

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  useEffect(() => {
    if (!socket) return

    const handleOrderUpdate = () => {
      fetchOrders()
    }

    const handleNewOrder = async () => {
      console.log('📦 New order received')
      await playOrderNotificationSound() // Play sound when new order arrives
      fetchOrders()
    }

    socket.on('order-updated', handleOrderUpdate)
    socket.on('new-order', handleNewOrder)

    return () => {
      socket.off('order-updated', handleOrderUpdate)
      socket.off('new-order', handleNewOrder)
    }
  }, [socket])

  const fetchOrders = async () => {
    try {
      const params = statusFilter ? { status: statusFilter } : {}
      const res = await axios.get('/restaurant-owners/my-restaurant/orders', { params })
      const newOrders = res.data.orders
      
      // Check if there's a new order (new order ID that wasn't in previous list)
      if (previousOrderIdsRef.current.size > 0) {
        const newOrderIds = new Set(newOrders.map(o => o._id))
        const hasNewOrder = Array.from(newOrderIds).some(id => !previousOrderIdsRef.current.has(id))
        
        if (hasNewOrder) {
          playOrderNotificationSound() // Play sound when new order arrives
        }
      }
      
      // Update previous order IDs
      previousOrderIdsRef.current = new Set(newOrders.map(o => o._id))
      setOrders(newOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await axios.put(`/restaurant-owners/my-restaurant/orders/${orderId}/status`, { status })
      fetchOrders()
      setToast({ message: 'Order status updated successfully', type: 'success' })
    } catch (error) {
      console.error('Error updating order status:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Error updating order status'
      setToast({ message: errorMessage, type: 'error' })
    }
  }

  const handleRejectClick = (orderId) => {
    setConfirmModal({
      isOpen: true,
      orderId,
      status: 'cancelled',
      action: 'reject',
      title: 'Reject Order',
      message: 'Are you sure you want to reject this order? This action cannot be undone.'
    })
  }

  const handleCancelClick = (orderId) => {
    setConfirmModal({
      isOpen: true,
      orderId,
      status: 'cancelled',
      action: 'cancel',
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order? This action cannot be undone.'
    })
  }

  const handleConfirm = () => {
    if (confirmModal.orderId && confirmModal.status) {
      updateOrderStatus(confirmModal.orderId, confirmModal.status)
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

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
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
        onClose={() => setConfirmModal({ isOpen: false, orderId: null, status: null, action: '' })}
        onConfirm={handleConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.action === 'reject' ? 'Reject Order' : 'Cancel Order'}
        cancelText="Cancel"
        type="danger"
      />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Orders</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="">All Orders</option>
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="rider-assigned">Rider Assigned</option>
          <option value="picking-up">Picking Up</option>
          <option value="delivering">Delivering</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <Link to={`/orders/${order._id}`} className="text-xl font-semibold text-primary hover:underline">
                  Order #{order.orderNumber}
                </Link>
                <p className="text-gray-600">Customer: {order.user?.name}</p>
                <p className="text-gray-600">Phone: {order.user?.phone}</p>
              </div>
              <span className={`px-3 py-1 rounded ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>

            <div className="mb-4">
              <p className="font-semibold">Items:</p>
              <ul className="list-disc list-inside">
                {order.items.map((item, idx) => (
                  <li key={idx}>{item.name} x {item.quantity}</li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-semibold">Total: {order.total} Ks</p>
                <p className="text-sm text-gray-600">Payment: {order.paymentMethod}</p>
              </div>
              <div className="space-x-2">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateOrderStatus(order._id, 'preparing')}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                    >
                      ✓ Accept Order
                    </button>
                    <button
                      onClick={() => handleRejectClick(order._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                    >
                      ✗ Reject Order
                    </button>
                  </>
                )}
                {order.status === 'preparing' && !order.rider && (
                  <button
                    onClick={() => handleCancelClick(order._id)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                  >
                    ✗ Cancel Order
                  </button>
                )}
                {order.status === 'rider-assigned' && order.rider && (
                  <button
                    onClick={() => updateOrderStatus(order._id, 'picking-up')}
                    className="bg-secondary text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                  >
                    Ready for Pickup
                  </button>
                )}
                <Link
                  to={`/orders/${order._id}`}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No orders found.</p>
        </div>
      )}
    </div>
  )
}

