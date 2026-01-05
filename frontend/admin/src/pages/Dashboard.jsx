import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import axios from 'axios'

export default function Dashboard() {
  const { isAuthenticated } = useAuth()
  const { socket } = useSocket()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats()
    }
  }, [isAuthenticated])

  // Real-time updates via Socket.io
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

  const fetchStats = async () => {
    try {
      const res = await axios.get('/admin/dashboard')
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={fetchStats}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition flex items-center gap-2"
          title="Refresh"
        >
          <span>🔄</span> Refresh
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/orders" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-600 mb-2">Today's Orders</h3>
              <p className="text-3xl font-bold text-secondary">{stats?.todayOrders || 0}</p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </Link>
        <Link to="/orders?status=pending" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-600 mb-2">Pending Orders</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats?.pendingOrders || 0}</p>
            </div>
            <div className="text-4xl">⏳</div>
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
        <Link to="/users" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-600 mb-2">Total Users</h3>
              <p className="text-3xl font-bold text-primary">{stats?.totalUsers || 0}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </Link>
        <Link to="/riders" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-600 mb-2">Total Riders</h3>
              <p className="text-3xl font-bold text-secondary">{stats?.totalRiders || 0}</p>
            </div>
            <div className="text-4xl">🚴</div>
          </div>
        </Link>
        <Link to="/restaurants" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-600 mb-2">Restaurants</h3>
              <p className="text-3xl font-bold text-accent">{stats?.totalRestaurants || 0}</p>
            </div>
            <div className="text-4xl">🍽️</div>
          </div>
        </Link>
        <Link to="/shops" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-600 mb-2">Shops</h3>
              <p className="text-3xl font-bold text-primary">{stats?.totalShops || 0}</p>
            </div>
            <div className="text-4xl">🛍️</div>
          </div>
        </Link>
      </div>

      {/* Payment Management Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">💳 Payment Management</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link 
            to="/orders?filter=pending-verification" 
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-l-4 border-yellow-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 mb-2">Pending Verifications</h3>
                <p className="text-3xl font-bold text-yellow-600">{stats?.pendingTransactionVerifications || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Transaction IDs to verify</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </Link>
          <Link 
            to="/orders?filter=pending-confirmation" 
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border-l-4 border-green-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 mb-2">Pending Confirmations</h3>
                <p className="text-3xl font-bold text-green-600">{stats?.pendingDeliveryConfirmations || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Deliveries to confirm</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </Link>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 mb-2">Delivery Fees Collected</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {stats?.totalDeliveryFeesCollected?.toLocaleString() || 0} Ks
                </p>
                <p className="text-xs text-gray-500 mt-1">From restaurants/shops</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 mb-2">Rider Fees Paid</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {stats?.totalRiderServiceFeesPaid?.toLocaleString() || 0} Ks
                </p>
                <p className="text-xs text-gray-500 mt-1">Service fees paid to riders</p>
              </div>
              <div className="text-4xl">🚴</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

