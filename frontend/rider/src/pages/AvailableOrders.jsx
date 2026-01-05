import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import axios from 'axios'
import Toast from '../components/Toast'
import { playOrderNotificationSound } from '../utils/soundNotification'

export default function AvailableOrders() {
  const { isAuthenticated } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders()
    }
  }, [isAuthenticated])

  // Real-time order updates via Socket.io
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

    const handleOrderAvailable = async () => {
      console.log('✅ Order available')
      await playOrderNotificationSound() // Play sound when order becomes available
      fetchOrders()
    }

    const handleOrderRemoved = (data) => {
      // Remove order from list if it was accepted by another rider
      setOrders(prevOrders => prevOrders.filter(o => o._id !== data.orderId))
    }

    socket.on('order-updated', handleOrderUpdate)
    socket.on('new-order', handleNewOrder)
    socket.on('order-available', handleOrderAvailable)
    socket.on('order-removed', handleOrderRemoved)

    return () => {
      socket.off('order-updated', handleOrderUpdate)
      socket.off('new-order', handleNewOrder)
      socket.off('order-available', handleOrderAvailable)
      socket.off('order-removed', handleOrderRemoved)
    }
  }, [socket])

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/riders/orders/available')
      setOrders(res.data.orders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (orderId) => {
    try {
      await axios.post(`/riders/orders/${orderId}/accept`)
      fetchOrders()
      navigate(`/orders/${orderId}`)
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to accept order', type: 'error' })
    }
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
      <h1 className="text-3xl font-bold mb-6">Available Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No available orders at the moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Order #{order.orderNumber}</h3>
                  <p className="text-gray-600 mb-2">
                    {order.restaurant?.name || order.shop?.name}
                  </p>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Customer:</strong> {order.user?.name} - {order.user?.phone}</p>
                    {order.orderType === 'user-to-user' && order.pickupAddress && (
                      <>
                        <p><strong>📍 Pickup:</strong> {order.pickupAddress.name} - {order.pickupAddress.township}, {order.pickupAddress.zone}</p>
                        <p><strong>🚚 Delivery:</strong> {order.deliveryAddress?.name} - {order.deliveryAddress?.township}, {order.deliveryAddress?.zone}</p>
                      </>
                    )}
                    {order.orderType !== 'user-to-user' && (
                      <>
                        <p><strong>📍 Pickup From:</strong> {order.restaurant?.name || order.shop?.name} - {order.restaurant?.address?.township || order.shop?.address?.township}, {order.restaurant?.address?.zone || order.shop?.address?.zone}</p>
                        <p className="text-xs text-gray-500 ml-4">{order.restaurant?.address?.street || order.shop?.address?.street}</p>
                        <p className="text-xs text-gray-500 ml-4">Phone: {order.restaurant?.phone || order.shop?.phone}</p>
                        <p><strong>🚚 Delivery To:</strong> {order.deliveryAddress?.name || order.user?.name} - {order.deliveryAddress?.township}, {order.deliveryAddress?.zone}</p>
                        <p className="text-xs text-gray-500 ml-4">{order.deliveryAddress?.street}</p>
                        <p className="text-xs text-gray-500 ml-4">Phone: {order.deliveryAddress?.phone || order.user?.phone}</p>
                      </>
                    )}
                    <p><strong>Total:</strong> <span className="text-primary font-bold">{order.total} Ks</span></p>
                    <p><strong>Delivery Fee:</strong> {order.deliveryFee} Ks (You get: {Math.round(order.deliveryFee * 0.8)} Ks)</p>
                  </div>
                </div>
                <div className="ml-6">
                  <button
                    onClick={() => handleAccept(order._id)}
                    className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-green-600 transition font-semibold"
                  >
                    Accept Order
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

