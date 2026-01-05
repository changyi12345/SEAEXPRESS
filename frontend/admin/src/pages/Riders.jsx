import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import axios from 'axios'
import Toast from '../components/Toast'

export default function Riders() {
  const { isAuthenticated } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()
  const [riders, setRiders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchRiders()
    }
  }, [isAuthenticated])

  // Real-time updates
  useEffect(() => {
    if (!socket) return

    const handleUpdate = () => {
      fetchRiders()
    }

    socket.on('order-updated', handleUpdate)

    return () => {
      socket.off('order-updated', handleUpdate)
    }
  }, [socket])

  const fetchRiders = async () => {
    try {
      const res = await axios.get('/admin/riders')
      setRiders(res.data.riders)
    } catch (error) {
      console.error('Error fetching riders:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (id, isActive) => {
    try {
      await axios.put(`/admin/riders/${id}`, { isActive: !isActive })
      fetchRiders()
    } catch (error) {
      setToast({ message: 'Failed to update rider', type: 'error' })
    }
  }

  const filteredRiders = riders.filter(rider => {
    const matchesSearch = searchTerm === '' || 
      rider.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rider.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rider.phone?.includes(searchTerm)
    
    const matchesStatus = statusFilter === '' || 
      (statusFilter === 'active' && rider.isActive) ||
      (statusFilter === 'inactive' && !rider.isActive)
    
    return matchesSearch && matchesStatus
  })

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
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Riders</h1>
        <div className="flex gap-4">
          <button
            onClick={fetchRiders}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition flex items-center gap-2"
            title="Refresh"
          >
            <span>🔄</span> Refresh
          </button>
          <input
            type="text"
            placeholder="Search riders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRiders.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  No riders found
                </td>
              </tr>
            ) : (
              filteredRiders.map((rider) => (
              <tr key={rider._id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{rider.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{rider.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{rider.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${rider.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {rider.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleActive(rider._id, rider.isActive)}
                    className={`px-3 py-1 rounded text-sm ${rider.isActive ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                  >
                    {rider.isActive ? 'Deactivate' : 'Activate'}
                  </button>
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

