import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import axios from 'axios'
import { playOrderNotificationSound } from '../utils/soundNotification'

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth()
  const { socket } = useSocket()
  const [stats, setStats] = useState(null)
  const [activeOrdersCount, setActiveOrdersCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats()
      fetchActiveOrders()
    }
  }, [isAuthenticated])

  const fetchActiveOrders = async () => {
    try {
      const res = await axios.get('/riders/orders', { params: { status: 'rider-assigned,picking-up,delivering' } })
      setActiveOrdersCount(res.data.orders.length)
    } catch (error) {
      console.error('Error fetching active orders:', error)
    }
  }

  // Real-time updates
  useEffect(() => {
    if (!socket || !user) return

    const handleOrderUpdate = async (updatedOrder) => {
      // Check if this order is assigned to the current rider
      const riderId = updatedOrder.rider?._id || updatedOrder.rider
      const currentRiderId = user._id || user.id
      
      // If order is assigned to this rider and status is rider-assigned, play sound
      if (riderId && riderId.toString() === currentRiderId.toString() && 
          updatedOrder.status === 'rider-assigned') {
        console.log('🎯 New order assigned to you!')
        await playOrderNotificationSound()
      }

      fetchActiveOrders()
      fetchStats()
    }

    const handleNewOrder = async () => {
      console.log('📦 New order received')
      await playOrderNotificationSound() // Play sound when new order arrives
      fetchActiveOrders()
      fetchStats()
    }

    const handleOrderAvailable = async () => {
      console.log('✅ Order available')
      await playOrderNotificationSound() // Play sound when order becomes available
      fetchActiveOrders()
      fetchStats()
    }

    const handleOrderAccepted = async (acceptedOrder) => {
      // When rider accepts an order, it's assigned to them
      console.log('🎯 Order accepted and assigned to you!')
      await playOrderNotificationSound()
      fetchActiveOrders()
      fetchStats()
    }

    socket.on('order-updated', handleOrderUpdate)
    socket.on('new-order', handleNewOrder)
    socket.on('order-available', handleOrderAvailable)
    socket.on('order-accepted', handleOrderAccepted)

    return () => {
      socket.off('order-updated', handleOrderUpdate)
      socket.off('new-order', handleNewOrder)
      socket.off('order-available', handleOrderAvailable)
      socket.off('order-accepted', handleOrderAccepted)
    }
  }, [socket, user])

  const fetchStats = async () => {
    try {
      const res = await axios.get('/riders/stats')
      setStats(res.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <button
          onClick={async () => {
            console.log('Testing sound...')
            await playOrderNotificationSound()
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition text-sm"
        >
         
        </button>
      </div>
      <h1 className="text-3xl font-bold mb-6">Rider Dashboard</h1>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 mb-2">Total Earnings</h3>
          <p className="text-3xl font-bold text-primary">{stats?.totalEarnings || 0} Ks</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 mb-2">Available Balance</h3>
          <p className="text-3xl font-bold text-green-600">{stats?.availableBalance || 0} Ks</p>
          {stats?.availableBalance > 0 && (
            <Link
              to="/withdrawal"
              className="mt-2 inline-block text-sm text-primary hover:underline"
            >
              Withdraw →
            </Link>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 mb-2">Total Deliveries</h3>
          <p className="text-3xl font-bold text-secondary">{stats?.totalDeliveries || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-600 mb-2">Active Orders</h3>
          <p className="text-3xl font-bold text-accent">{activeOrdersCount}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Link
          to="/orders/available"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition block"
        >
          <h2 className="text-xl font-semibold mb-2">Available Orders</h2>
          <p className="text-gray-600">View and accept new delivery orders</p>
        </Link>

        <Link
          to="/orders"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition block"
        >
          <h2 className="text-xl font-semibold mb-2">My Orders</h2>
          <p className="text-gray-600">Manage your active deliveries</p>
        </Link>

        <Link
          to="/withdrawal"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition block"
        >
          <h2 className="text-xl font-semibold mb-2">Withdraw Earnings</h2>
          <p className="text-gray-600">Request withdrawal of your earnings</p>
          {stats?.availableBalance > 0 && (
            <p className="text-primary font-semibold mt-2">{stats.availableBalance} Ks available</p>
          )}
        </Link>
      </div>
    </div>
  )
}

