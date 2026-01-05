import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

export default function Delivery() {
  const { isAuthenticated, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [pickupAddress, setPickupAddress] = useState({
    street: '',
    city: 'Yangon',
    township: '',
    zone: '',
    phone: user?.phone || '',
    name: '',
    notes: ''
  })
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: 'Yangon',
    township: '',
    zone: '',
    phone: '',
    name: '',
    notes: ''
  })
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [deliveryFee, setDeliveryFee] = useState(2000)

  useEffect(() => {
    // Wait for auth to finish loading before checking authentication
    if (authLoading) return

    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    calculateFee()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupAddress.zone, deliveryAddress.zone, isAuthenticated, authLoading])

  const calculateFee = async () => {
    if (!pickupAddress.zone && !deliveryAddress.zone) {
      setDeliveryFee(2000)
      return
    }

    try {
      let pickupFee = 2000
      let deliveryFeeAmount = 2000

      if (pickupAddress.zone && pickupAddress.township) {
        try {
          const res = await axios.get(`/delivery-fees/township/${encodeURIComponent(pickupAddress.township)}`)
          if (res.data.fee) {
            pickupFee = res.data.fee.fee
          }
        } catch (error) {
          console.error('Error fetching pickup fee:', error)
        }
      }

      if (deliveryAddress.zone && deliveryAddress.township) {
        try {
          const res = await axios.get(`/delivery-fees/township/${encodeURIComponent(deliveryAddress.township)}`)
          if (res.data.fee) {
            deliveryFeeAmount = res.data.fee.fee
          }
        } catch (error) {
          console.error('Error fetching delivery fee:', error)
        }
      }

      // Total fee = max of pickup and delivery fees
      setDeliveryFee(Math.max(pickupFee, deliveryFeeAmount))
    } catch (error) {
      console.error('Error calculating fee:', error)
      setDeliveryFee(2000)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (!pickupAddress.street || !pickupAddress.township || !pickupAddress.phone || !pickupAddress.name) {
      alert('Please fill in all pickup address fields')
      setLoading(false)
      return
    }

    if (!deliveryAddress.street || !deliveryAddress.township || !deliveryAddress.phone || !deliveryAddress.name) {
      alert('Please fill in all delivery address fields')
      setLoading(false)
      return
    }

    try {
      const orderData = {
        orderType: 'user-to-user',
        pickupAddress: {
          street: pickupAddress.street,
          city: pickupAddress.city || 'Yangon',
          township: pickupAddress.township,
          zone: pickupAddress.zone,
          phone: pickupAddress.phone,
          name: pickupAddress.name,
          notes: pickupAddress.notes || ''
        },
        deliveryAddress: {
          street: deliveryAddress.street,
          city: deliveryAddress.city || 'Yangon',
          township: deliveryAddress.township,
          zone: deliveryAddress.zone,
          phone: deliveryAddress.phone,
          name: deliveryAddress.name,
          notes: deliveryAddress.notes || ''
        },
        paymentMethod: paymentMethod || 'cod',
        notes: `Pickup from: ${pickupAddress.name}, Deliver to: ${deliveryAddress.name}`
      }

      console.log('Sending order data:', orderData)
      const res = await axios.post('/orders', orderData)
      navigate(`/orders/${res.data.order._id}`)
    } catch (error) {
      console.error('Error creating order:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create delivery order. Please try again.'
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 md:mb-6">ပစ္စည်းပို့ဆောင်မှု (User-to-User Delivery)</h1>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Pickup Address */}
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 md:mb-4 text-primary">ယူရမည့်နေရာ (Pickup Location)</h2>
            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="block mb-2 font-semibold text-sm sm:text-base text-gray-700">Sender Name *</label>
                <input
                  type="text"
                  value={pickupAddress.name}
                  onChange={(e) => setPickupAddress({ ...pickupAddress, name: e.target.value })}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary touch-manipulation"
                  placeholder="Enter sender name"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-sm sm:text-base text-gray-700">Street Address *</label>
                <input
                  type="text"
                  value={pickupAddress.street}
                  onChange={(e) => setPickupAddress({ ...pickupAddress, street: e.target.value })}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary touch-manipulation"
                  placeholder="Street, Building, etc."
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-sm sm:text-base text-gray-700">Township *</label>
                <input
                  type="text"
                  value={pickupAddress.township}
                  onChange={(e) => setPickupAddress({ ...pickupAddress, township: e.target.value })}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary touch-manipulation"
                  placeholder="Enter township"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-sm sm:text-base text-gray-700">Zone *</label>
                <select
                  value={pickupAddress.zone}
                  onChange={(e) => setPickupAddress({ ...pickupAddress, zone: e.target.value })}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary touch-manipulation"
                  required
                >
                  <option value="">Select Zone</option>
                  <option value="ဗဟိုခရိုင်">ဗဟိုခရိုင်</option>
                  <option value="အရှေ့ပိုင်း">အရှေ့ပိုင်း</option>
                  <option value="အနောက်ပိုင်း">အနောက်ပိုင်း</option>
                  <option value="အဝေးပိုင်း">အဝေးပိုင်း</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-semibold text-sm sm:text-base text-gray-700">Phone *</label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={pickupAddress.phone}
                  onChange={(e) => setPickupAddress({ ...pickupAddress, phone: e.target.value })}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary touch-manipulation"
                  placeholder="09xxxxxxxxx"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-sm sm:text-base text-gray-700">Pickup Notes</label>
                <textarea
                  value={pickupAddress.notes}
                  onChange={(e) => setPickupAddress({ ...pickupAddress, notes: e.target.value })}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary touch-manipulation"
                  rows="3"
                  placeholder="Pickup instructions..."
                />
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 md:mb-4 text-accent">ပို့ပေးရမည့်နေရာ (Delivery Location)</h2>
            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="block mb-2 font-semibold text-sm sm:text-base">Recipient Name *</label>
                <input
                  type="text"
                  value={deliveryAddress.name}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, name: e.target.value })}
                  className="w-full px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-sm sm:text-base">Street Address *</label>
                <input
                  type="text"
                  value={deliveryAddress.street}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                  className="w-full px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-sm sm:text-base">Township *</label>
                <input
                  type="text"
                  value={deliveryAddress.township}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, township: e.target.value })}
                  className="w-full px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-sm sm:text-base">Zone *</label>
                <select
                  value={deliveryAddress.zone}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, zone: e.target.value })}
                  className="w-full px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select Zone</option>
                  <option value="ဗဟိုခရိုင်">ဗဟိုခရိုင်</option>
                  <option value="အရှေ့ပိုင်း">အရှေ့ပိုင်း</option>
                  <option value="အနောက်ပိုင်း">အနောက်ပိုင်း</option>
                  <option value="အဝေးပိုင်း">အဝေးပိုင်း</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-semibold text-sm sm:text-base">Phone *</label>
                <input
                  type="tel"
                  value={deliveryAddress.phone}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, phone: e.target.value })}
                  className="w-full px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-sm sm:text-base">Delivery Notes</label>
                <textarea
                  value={deliveryAddress.notes}
                  onChange={(e) => setDeliveryAddress({ ...deliveryAddress, notes: e.target.value })}
                  className="w-full px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows="3"
                  placeholder="Delivery instructions..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment & Summary */}
        <div className="mt-6 md:mt-8 bg-white rounded-lg shadow p-4 md:p-6">
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <h3 className="font-semibold mb-3 md:mb-4 text-sm sm:text-base">Payment Method</h3>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="cod">Cash on Delivery</option>
                <option value="kbzpay">KBZ Pay</option>
                <option value="wavemoney">Wave Money</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
            <div>
              <h3 className="font-semibold mb-3 md:mb-4 text-sm sm:text-base">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm sm:text-base">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-primary">{deliveryFee} Ks</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-base sm:text-lg">
                  <span>Total</span>
                  <span className="text-primary">{deliveryFee} Ks</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 md:mt-6 bg-primary text-white py-4 rounded-lg hover:bg-primary-dark active:bg-primary-dark transition font-semibold disabled:opacity-50 text-base sm:text-lg touch-manipulation min-h-[52px] shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Order...
              </span>
            ) : (
              'Create Delivery Order'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

