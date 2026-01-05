import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import axios from 'axios'
import { playOrderNotificationSound } from '../utils/soundNotification'

export default function MyOrders() {
  const { isAuthenticated, user } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const previousOrderIdsRef = useRef(new Set())

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders()
    }
  }, [isAuthenticated, filter])

  // Real-time order updates via Socket.io
  useEffect(() => {
    if (!socket || !user) return

    const handleOrderUpdate = async (updatedOrder) => {
      // Check if this order is assigned to the current rider
      const riderId = updatedOrder.rider?._id || updatedOrder.rider
      const currentRiderId = user._id || user.id
      
      // If order is assigned to this rider and status is rider-assigned, play sound
      if (riderId && riderId.toString() === currentRiderId.toString() && 
          updatedOrder.status === 'rider-assigned') {
        // Check if this is a new order (not in previous list)
        const isNewOrder = !previousOrderIdsRef.current.has(updatedOrder._id)
        if (isNewOrder) {
          console.log('🎯 New order assigned to you!')
          await playOrderNotificationSound()
        }
      }

      setOrders(prevOrders => {
        const existingOrder = prevOrders.find(o => o._id === updatedOrder._id)
        if (existingOrder) {
          // Update existing order
          return prevOrders.map(order => 
            order._id === updatedOrder._id ? updatedOrder : order
          )
        } else {
          // New order assigned to rider
          if (updatedOrder.rider && 
              (updatedOrder.rider._id?.toString() === currentRiderId.toString() || 
               updatedOrder.rider.toString() === currentRiderId.toString())) {
            console.log('🎯 New order assigned to you!')
            playOrderNotificationSound()
            return [...prevOrders, updatedOrder]
          }
          return prevOrders
        }
      })
    }

    const handleOrderAccepted = async (acceptedOrder) => {
      // When rider accepts an order, it's assigned to them
      console.log('🎯 Order accepted and assigned to you!')
      await playOrderNotificationSound()
      fetchOrders() // Refresh orders list
    }

    socket.on('order-updated', handleOrderUpdate)
    socket.on('order-accepted', handleOrderAccepted)

    return () => {
      socket.off('order-updated', handleOrderUpdate)
      socket.off('order-accepted', handleOrderAccepted)
    }
  }, [socket, user])

  const fetchOrders = async () => {
    try {
      const params = filter ? { status: filter } : {}
      const res = await axios.get('/riders/orders', { params })
      const newOrders = res.data.orders
      
      // Check if there's a new order assigned (new order ID that wasn't in previous list)
      if (previousOrderIdsRef.current.size > 0) {
        const newOrderIds = new Set(newOrders.map(o => o._id))
        const hasNewOrder = Array.from(newOrderIds).some(id => !previousOrderIdsRef.current.has(id))
        
        if (hasNewOrder) {
          console.log('🎯 New order assigned to you!')
          await playOrderNotificationSound()
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

  const getStatusColor = (status) => {
    const colors = {
      'rider-assigned': 'bg-purple-100 text-purple-800',
      'picking-up': 'bg-indigo-100 text-indigo-800',
      'picked-up': 'bg-teal-100 text-teal-800',
      delivering: 'bg-green-100 text-green-800',
      delivered: 'bg-green-200 text-green-900'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status) => {
    const texts = {
      'rider-assigned': 'Assigned',
      'picking-up': 'Picking Up',
      'picked-up': 'Picked Up',
      delivering: 'Delivering',
      delivered: 'Delivered'
    }
    return texts[status] || status
  }

  if (loading) {
    return <div className="container mx-auto px-3 sm:px-4 py-8 text-center">Loading...</div>
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 md:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 md:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">My Orders</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 sm:px-4 py-2 border rounded text-sm sm:text-base w-full sm:w-auto touch-manipulation"
        >
          <option value="">All Orders</option>
          <option value="rider-assigned">Assigned</option>
          <option value="picking-up">Picking Up</option>
          <option value="delivering">Delivering</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm sm:text-base">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/orders/${order._id}`}
              className="block bg-white rounded-lg shadow p-4 md:p-6 hover:shadow-lg active:shadow-md transition touch-manipulation"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Order #{order.orderNumber}</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-1 sm:mb-2">
                    {order.restaurant?.name || order.shop?.name}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">
                    Customer: {order.user?.name} - {order.user?.phone}
                  </p>
                  {order.orderType === 'user-to-user' && order.pickupAddress && (
                    <p className="text-xs sm:text-sm text-primary mb-1">
                      📍 Pickup: {order.pickupAddress.name} - {order.pickupAddress.township}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-gray-500">
                    🚚 Delivery: {order.deliveryAddress?.township}, {order.deliveryAddress?.zone}
                  </p>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                  <p className="text-primary font-bold mt-2 text-base sm:text-lg">{order.total} Ks</p>
                  <p className="text-xs sm:text-sm text-gray-500">Fee: {order.deliveryFee} Ks</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

