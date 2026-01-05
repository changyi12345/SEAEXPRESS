import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import axios from 'axios'

export default function Withdrawals() {
  const { isAuthenticated } = useAuth()
  const { socket } = useSocket()
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [action, setAction] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      fetchWithdrawals()
    }
  }, [isAuthenticated, statusFilter])

  // Real-time updates via Socket.io
  useEffect(() => {
    if (!socket) return

    const handleWithdrawalUpdate = (data) => {
      setWithdrawals(prev => 
        prev.map(w => 
          w._id === data.withdrawal._id ? data.withdrawal : w
        )
      )
    }

    const handleNewWithdrawal = (data) => {
      setWithdrawals(prev => [data.withdrawal, ...prev])
    }

    socket.on('withdrawal-updated', handleWithdrawalUpdate)
    socket.on('new-withdrawal', handleNewWithdrawal)

    return () => {
      socket.off('withdrawal-updated', handleWithdrawalUpdate)
      socket.off('new-withdrawal', handleNewWithdrawal)
    }
  }, [socket])

  const fetchWithdrawals = async () => {
    try {
      const params = statusFilter ? { status: statusFilter } : {}
      const res = await axios.get('/admin/withdrawals', { params })
      setWithdrawals(res.data.withdrawals || [])
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (withdrawal, actionType) => {
    setSelectedWithdrawal(withdrawal)
    setAction(actionType)
    setShowModal(true)
    setRejectionReason('')
  }

  const confirmAction = async () => {
    if (!selectedWithdrawal) return

    setProcessing(true)
    try {
      let endpoint = ''
      let data = {}

      if (action === 'approve') {
        endpoint = `/admin/withdrawals/${selectedWithdrawal._id}/approve`
      } else if (action === 'reject') {
        endpoint = `/admin/withdrawals/${selectedWithdrawal._id}/reject`
        data = { rejectionReason }
      } else if (action === 'complete') {
        endpoint = `/admin/withdrawals/${selectedWithdrawal._id}/complete`
      }

      await axios.put(endpoint, data)
      setShowModal(false)
      setSelectedWithdrawal(null)
      fetchWithdrawals()
    } catch (error) {
      console.error('Error processing withdrawal:', error)
      alert(error.response?.data?.message || 'Failed to process withdrawal')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length
  const totalAmount = withdrawals.reduce((sum, w) => sum + w.amount, 0)
  const pendingAmount = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0)

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Rider Withdrawals</h1>
        <button
          onClick={fetchWithdrawals}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition flex items-center gap-2"
        >
          <span>🔄</span> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Withdrawals</p>
          <p className="text-2xl font-bold">{withdrawals.length}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4 border border-yellow-200">
          <p className="text-yellow-700 text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4 border border-yellow-200">
          <p className="text-yellow-700 text-sm">Pending Amount</p>
          <p className="text-2xl font-bold text-yellow-700">{pendingAmount} Ks</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Amount</p>
          <p className="text-2xl font-bold">{totalAmount} Ks</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-4 py-2 rounded-lg transition ${
            statusFilter === '' 
              ? 'bg-primary text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-4 py-2 rounded-lg transition ${
            statusFilter === 'pending' 
              ? 'bg-primary text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Pending ({withdrawals.filter(w => w.status === 'pending').length})
        </button>
        <button
          onClick={() => setStatusFilter('approved')}
          className={`px-4 py-2 rounded-lg transition ${
            statusFilter === 'approved' 
              ? 'bg-primary text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`px-4 py-2 rounded-lg transition ${
            statusFilter === 'completed' 
              ? 'bg-primary text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`px-4 py-2 rounded-lg transition ${
            statusFilter === 'rejected' 
              ? 'bg-primary text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Rejected
        </button>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rider</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {withdrawals.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No withdrawals found
                </td>
              </tr>
            ) : (
              withdrawals.map((withdrawal) => (
                <tr key={withdrawal._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDate(withdrawal.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{withdrawal.rider?.name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{withdrawal.rider?.phone || ''}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-bold text-lg">{withdrawal.amount} Ks</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p><strong>Bank:</strong> {withdrawal.bankName}</p>
                      <p><strong>Account:</strong> {withdrawal.accountNumber}</p>
                      <p><strong>Name:</strong> {withdrawal.accountName}</p>
                      <p><strong>Phone:</strong> {withdrawal.phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(withdrawal.status)}`}>
                      {withdrawal.status}
                    </span>
                    {withdrawal.processedBy && (
                      <p className="text-xs text-gray-500 mt-1">
                        By: {withdrawal.processedBy?.name || 'Admin'}
                      </p>
                    )}
                    {withdrawal.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">
                        Reason: {withdrawal.rejectionReason}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      {withdrawal.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAction(withdrawal, 'approve')}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(withdrawal, 'reject')}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {withdrawal.status === 'approved' && (
                        <button
                          onClick={() => handleAction(withdrawal, 'complete')}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Action Modal */}
      {showModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">
              {action === 'approve' && 'Approve Withdrawal'}
              {action === 'reject' && 'Reject Withdrawal'}
              {action === 'complete' && 'Mark as Completed'}
            </h3>
            <div className="mb-4">
              <p><strong>Rider:</strong> {selectedWithdrawal.rider?.name}</p>
              <p><strong>Amount:</strong> {selectedWithdrawal.amount} Ks</p>
              <p><strong>Bank:</strong> {selectedWithdrawal.bankName}</p>
              <p><strong>Account:</strong> {selectedWithdrawal.accountNumber}</p>
            </div>
            {action === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason (Optional)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows="3"
                  placeholder="Enter reason for rejection..."
                />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedWithdrawal(null)
                  setRejectionReason('')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={processing}
                className={`px-4 py-2 rounded-lg text-white transition ${
                  action === 'approve' ? 'bg-green-500 hover:bg-green-600' :
                  action === 'reject' ? 'bg-red-500 hover:bg-red-600' :
                  'bg-blue-500 hover:bg-blue-600'
                } disabled:opacity-50`}
              >
                {processing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

