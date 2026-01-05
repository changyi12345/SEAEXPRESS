import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

export default function DeliveryFees() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      fetchFees()
    }
  }, [isAuthenticated])

  const fetchFees = async () => {
    try {
      const res = await axios.get('/delivery-fees')
      setFees(res.data.fees)
    } catch (error) {
      console.error('Error fetching delivery fees:', error)
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
        <h1 className="text-3xl font-bold">Delivery Fees</h1>
        <button
          onClick={fetchFees}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition flex items-center gap-2"
          title="Refresh"
        >
          <span>🔄</span> Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone (English)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Townships</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee (Ks)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {fees.map((fee) => (
              <tr key={fee._id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{fee.zone}</td>
                <td className="px-6 py-4 whitespace-nowrap">{fee.zoneEnglish}</td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600">
                    {fee.townships?.join(', ') || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-bold text-primary">
                  {fee.fee} Ks
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${fee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {fee.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Delivery Fee Structure (Yangon)</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>ဗဟိုခရိုင် (လမ်းမများ): ၂,၅၀၀ ကျပ်</li>
          <li>အရှေ့ပိုင်းမြို့နယ်များ: ၃,၀၀၀ ကျပ်</li>
          <li>အနောက်ပိုင်းမြို့နယ်များ: ၃,၅၀၀ ကျပ်</li>
          <li>မြို့ပြအဝေးပိုင်း: ၄,၀၀၀ ကျပ်+</li>
          <li>အနည်းဆုံးပို့ခကြေး: ၂,၀၀၀ ကျပ်</li>
        </ul>
      </div>
    </div>
  )
}

