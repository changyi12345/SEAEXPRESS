import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

export default function Stats() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats()
    }
  }, [isAuthenticated, startDate, endDate])

  const fetchStats = async () => {
    try {
      const params = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      const res = await axios.get('/riders/stats', { params })
      setStats(res.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="container mx-auto px-3 sm:px-4 py-8 text-center">Loading...</div>
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 md:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 md:mb-6">Income & Statistics</h1>

      <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-4 md:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 md:mb-4">Filter by Date</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <div>
            <label className="block mb-1 sm:mb-2 text-sm sm:text-base">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border rounded text-sm sm:text-base touch-manipulation"
            />
          </div>
          <div>
            <label className="block mb-1 sm:mb-2 text-sm sm:text-base">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border rounded text-sm sm:text-base touch-manipulation"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h3 className="text-sm sm:text-base text-gray-600 mb-2">Total Earnings</h3>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">{stats?.totalEarnings || 0} Ks</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">80% of delivery fees</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h3 className="text-sm sm:text-base text-gray-600 mb-2">Total Deliveries</h3>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-secondary">{stats?.totalDeliveries || 0}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">Completed orders</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 md:p-6 sm:col-span-2 md:col-span-1">
          <h3 className="text-sm sm:text-base text-gray-600 mb-2">Average per Delivery</h3>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-accent">
            {stats?.totalDeliveries > 0 
              ? Math.round((stats.totalEarnings || 0) / stats.totalDeliveries) 
              : 0} Ks
          </p>
        </div>
      </div>
    </div>
  )
}

