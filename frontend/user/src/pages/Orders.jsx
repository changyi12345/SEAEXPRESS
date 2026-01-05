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
    <div className="container mx-auto px-3 sm:px-4 py-4 md:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 md:mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 md:py-16">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-600 mb-6 text-base">No orders yet</p>
          <Link
            to="/restaurants"
            className="inline-block bg-primary text-white px-8 py-3.5 rounded-lg hover:bg-primary-dark active:bg-primary-dark transition font-semibold text-base touch-manipulation min-h-[44px] shadow-lg"
          >
            Browse Restaurants
          </Link>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/orders/${order._id}`}
              className="block bg-white rounded-lg shadow-md p-4 md:p-6 hover:shadow-lg active:shadow-md transition touch-manipulation border border-gray-100"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-semibold text-base sm:text-lg">Order #{order.orderNumber}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 font-medium truncate mb-1">
                    {order.restaurant?.name || order.shop?.name}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center justify-end w-full sm:w-auto">
                  <p className="text-primary font-bold text-lg sm:text-xl">{order.total} Ks</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

