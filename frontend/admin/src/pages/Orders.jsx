import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import axios from 'axios'

export default function Orders() {
  const { isAuthenticated } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders()
    }
  }, [isAuthenticated, filter, page])

  // Real-time order updates via Socket.io
  useEffect(() => {
    if (!socket) return

    const handleOrderUpdate = (updatedOrder) => {
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === updatedOrder._id ? updatedOrder : order
        )
      )
    }

    socket.on('order-updated', handleOrderUpdate)

    return () => {
      socket.off('order-updated', handleOrderUpdate)
    }
  }, [socket])

  const fetchOrders = async () => {
    try {
      const params = { page, limit: 20 }
      if (filter === 'pending-verification') {
        // Custom filter for orders needing transaction ID verification
        params.pendingVerification = true
      } else if (filter === 'pending-confirmation') {
        // Custom filter for orders needing delivery confirmation
        params.pendingConfirmation = true
      } else if (filter) {
        params.status = filter
      }
      const res = await axios.get('/admin/orders', { params })
      setOrders(res.data.orders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.phone?.includes(searchTerm) ||
      order.restaurant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shop?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

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
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Orders</h1>
        <div className="flex gap-4">
          <button
            onClick={fetchOrders}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition flex items-center gap-2"
            title="Refresh"
          >
            <span>🔄</span> Refresh
          </button>
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
            <option value="pending-verification">Pending Verification</option>
            <option value="pending-confirmation">Pending Confirmation</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Restaurant/Shop</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rider</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                  No orders found
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
              <tr 
                key={order._id}
                onClick={() => navigate(`/orders/${order._id}`)}
                className="cursor-pointer hover:bg-gray-50 transition"
              >
                <td className="px-6 py-4 whitespace-nowrap font-medium text-primary hover:underline">{order.orderNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    order.orderType === 'user-to-user' ? 'bg-purple-100 text-purple-800' :
                    order.orderType === 'restaurant' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {order.orderType === 'user-to-user' ? 'Delivery' : order.orderType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div>{order.user?.name}</div>
                    <div className="text-sm text-gray-500">{order.user?.phone}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {order.restaurant?.name || order.shop?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {order.rider?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-bold text-primary">
                  {order.total} Ks
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${
                        order.paymentStatus === 'paid' ? 'bg-green-500' :
                        order.paymentStatus === 'failed' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`}></span>
                      <span className="text-xs">{order.paymentStatus}</span>
                    </div>
                    {(order.orderType === 'restaurant' || order.orderType === 'shop') && (
                      <>
                        {order.riderPaymentTransactionId && (
                          <div className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${
                              order.riderPaymentStatus === 'verified' ? 'bg-green-500' :
                              order.riderPaymentStatus === 'failed' ? 'bg-red-500' :
                              'bg-yellow-500'
                            }`}></span>
                            <span className="text-xs">
                              {order.riderPaymentStatus === 'verified' ? 'Verified' :
                               order.riderPaymentStatus === 'failed' ? 'Failed' :
                               'Pending Verify'}
                            </span>
                          </div>
                        )}
                        {order.status === 'delivered' && order.riderPaymentStatus === 'verified' && (
                          <div className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${
                              order.riderServiceFeeStatus === 'paid' ? 'bg-green-500' : 'bg-yellow-500'
                            }`}></span>
                            <span className="text-xs">
                              {order.riderServiceFeeStatus === 'paid' ? 'Rider Paid' : 'Pending Pay'}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

