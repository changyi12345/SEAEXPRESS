import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import axios from 'axios'

export default function Withdrawal() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [stats, setStats] = useState(null)
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    accountName: '',
    accountNumber: '',
    bankName: '',
    phone: user?.phone || ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  // Real-time updates via Socket.io
  useEffect(() => {
    if (!socket) return

    const handleWithdrawalUpdate = (data) => {
      setWithdrawals(prev => 
        prev.map(w => 
          w._id === data.withdrawal._id ? data.withdrawal : w
        )
      )
      fetchData() // Refresh stats to update available balance
    }

    socket.on('withdrawal-updated', handleWithdrawalUpdate)

    return () => {
      socket.off('withdrawal-updated', handleWithdrawalUpdate)
    }
  }, [socket])

  const fetchData = async () => {
    try {
      const [statsRes, withdrawalsRes] = await Promise.all([
        axios.get('/riders/stats'),
        axios.get('/riders/withdrawals')
      ])
      setStats(statsRes.data)
      setWithdrawals(withdrawalsRes.data.withdrawals || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount')
        setSubmitting(false)
        return
      }

      if (amount > stats.availableBalance) {
        setError(`Insufficient balance. Available: ${stats.availableBalance} Ks`)
        setSubmitting(false)
        return
      }

      await axios.post('/riders/withdrawals', {
        amount,
        accountName: formData.accountName.trim(),
        accountNumber: formData.accountNumber.trim(),
        bankName: formData.bankName.trim(),
        phone: formData.phone.trim()
      })

      setSuccess('Withdrawal request submitted successfully!')
      setFormData({
        amount: '',
        accountName: '',
        accountNumber: '',
        bankName: '',
        phone: user?.phone || ''
      })
      fetchData()
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit withdrawal request')
    } finally {
      setSubmitting(false)
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

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Withdraw Earnings</h1>

      {/* Balance Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Balance Information</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-600 mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-green-600">{stats?.availableBalance || 0} Ks</p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Total Earned</p>
            <p className="text-2xl font-bold text-primary">{stats?.totalEarned || 0} Ks</p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Total Withdrawn</p>
            <p className="text-2xl font-bold text-gray-600">{stats?.totalWithdrawn || 0} Ks</p>
          </div>
        </div>
        {!stats?.canWithdraw && stats?.daysUntilNextWithdrawal > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800">
              ⏰ You can withdraw again in <strong>{stats.daysUntilNextWithdrawal} day(s)</strong>
            </p>
            {stats.lastWithdrawalDate && (
              <p className="text-sm text-yellow-700 mt-1">
                Last withdrawal: {formatDate(stats.lastWithdrawalDate)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Withdrawal Form */}
      {stats?.canWithdraw && stats?.availableBalance > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Request Withdrawal</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800">
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (Ks) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  max={stats?.availableBalance}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {stats?.availableBalance || 0} Ks
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number *
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name *
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., KBZ, CB, AYA, UAB"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !stats?.canWithdraw}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Withdrawal Request'}
            </button>
          </form>
        </div>
      )}

      {/* Withdrawal History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Withdrawal History</h2>
        {withdrawals.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No withdrawal history</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Bank</th>
                  <th className="text-left py-3 px-4">Account</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{formatDate(withdrawal.createdAt)}</td>
                    <td className="py-3 px-4 font-semibold">{withdrawal.amount} Ks</td>
                    <td className="py-3 px-4">{withdrawal.bankName}</td>
                    <td className="py-3 px-4">{withdrawal.accountNumber}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

