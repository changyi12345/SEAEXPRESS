import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function Orders() {
  const { isAuthenticated, user, loading: authLoading } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/users/orders')
      setOrders(res.data.orders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Wait for auth to finish loading before checking authentication
    if (authLoading) return

    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchOrders()
  }, [isAuthenticated, authLoading, navigate])

  // Real-time order updates via Socket.io
  useEffect(() => {
    if (!socket || !user) return

    // Listen for order updates
    const handleOrderUpdate = (updatedOrder) => {
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === updatedOrder._id ? updatedOrder : order
        )
      )
    }

    const handleOrderCancelled = (cancelledOrder) => {
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === cancelledOrder._id ? cancelledOrder : order
        )
      )
    }

    socket.on('order-updated', handleOrderUpdate)
    socket.on('order-cancelled', handleOrderCancelled)

    return () => {
      socket.off('order-updated', handleOrderUpdate)
      socket.off('order-cancelled', handleOrderCancelled)
    }
  }, [socket, user])

  useEffect(() => {
    // Wait for auth to finish loading before checking authentication
    if (authLoading) return

    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchOrders()
  }, [isAuthenticated, authLoading, navigate])

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      'rider-assigned': 'bg-purple-100 text-purple-800',
      'picking-up': 'bg-indigo-100 text-indigo-800',
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
      delivering: 'Delivering',
      delivered: 'Delivered',
      completed: 'Completed',
      cancelled: 'Cancelled'
    }
    return texts[status] || status
  }

  // Show loading while checking authentication or fetching orders
  if (authLoading || loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No orders yet</p>
          <Link
            to="/restaurants"
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition"
          >
            Browse Restaurants
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/orders/${order._id}`}
              className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Order #{order.orderNumber}</h3>
                  <p className="text-gray-600">
                    {order.restaurant?.name || order.shop?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                  <p className="text-primary font-bold mt-2">{order.total} Ks</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

