import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import axios from 'axios'

export default function Dashboard() {
  const { isAuthenticated } = useAuth()
  const { socket } = useSocket()
  const [restaurant, setRestaurant] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      fetchRestaurant()
      fetchStats()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!socket) return

    const handleOrderUpdate = () => {
      fetchStats()
    }

    socket.on('order-updated', handleOrderUpdate)

    return () => {
      socket.off('order-updated', handleOrderUpdate)
    }
  }, [socket])

  const fetchRestaurant = async () => {
    try {
      const res = await axios.get('/restaurant-owners/my-restaurant')
      setRestaurant(res.data.restaurant)
    } catch (error) {
      console.error('Error fetching restaurant:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await axios.get('/restaurant-owners/my-restaurant/stats')
      setStats(res.data.stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  if (!restaurant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No Restaurant Found</h2>
          <p className="text-gray-600 mb-6">Please contact admin to set up your restaurant.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
        <p className="text-gray-600">{restaurant.nameMyanmar}</p>
        {!restaurant.isApproved && (
          <div className="mt-4 bg-yellow-100 text-yellow-800 p-3 rounded">
            Your restaurant is pending approval from admin.
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/orders?status=pending" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-600 mb-2">Pending Orders</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats?.pendingOrders || 0}</p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </Link>
        <Link to="/orders" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-600 mb-2">Today's Orders</h3>
              <p className="text-3xl font-bold text-secondary">{stats?.todayOrders || 0}</p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </Link>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-600 mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-green-600">{stats?.totalRevenue?.toLocaleString() || 0} Ks</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>
        <Link to="/menu" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-600 mb-2">Menu Items</h3>
              <p className="text-3xl font-bold text-primary">{stats?.menuItems || 0}</p>
            </div>
            <div className="text-4xl">🍽️</div>
          </div>
        </Link>
      </div>

      {/* Delivery Fees Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">🚚 Delivery Fees to SEA EXPRESS</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 mb-2">Paid to SEA EXPRESS</h3>
                <p className="text-3xl font-bold text-green-600">{stats?.deliveryFeesPaid?.toLocaleString() || 0} Ks</p>
                <p className="text-xs text-gray-500 mt-1">Delivery fees already paid</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 mb-2">Pending Payment</h3>
                <p className="text-3xl font-bold text-yellow-600">{stats?.deliveryFeesPending?.toLocaleString() || 0} Ks</p>
                <p className="text-xs text-gray-500 mt-1">Fees to be paid</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 mb-2">Total Delivery Fees</h3>
                <p className="text-3xl font-bold text-blue-600">{stats?.totalDeliveryFees?.toLocaleString() || 0} Ks</p>
                <p className="text-xs text-gray-500 mt-1">Paid + Pending</p>
              </div>
              <div className="text-4xl">💸</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link
          to="/orders"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition block"
        >
          <h2 className="text-xl font-semibold mb-2">View All Orders</h2>
          <p className="text-gray-600">Manage and track all orders</p>
        </Link>

        <Link
          to="/menu"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition block"
        >
          <h2 className="text-xl font-semibold mb-2">Manage Menu</h2>
          <p className="text-gray-600">Add, edit, or remove menu items</p>
        </Link>
      </div>
    </div>
  )
}

