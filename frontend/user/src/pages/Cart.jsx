import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart, getCartTotal } = useCart()
  const { isAuthenticated, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [deliveryFee, setDeliveryFee] = useState(2000)
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || 'Yangon',
    township: user?.address?.township || '',
    zone: user?.address?.zone || '',
    phone: user?.phone || ''
  })
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [transactionId, setTransactionId] = useState('')
  const [paymentAccount, setPaymentAccount] = useState(null)
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState(['cod'])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Wait for auth to finish loading before checking authentication
    if (authLoading) return

    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (deliveryAddress.zone) {
      fetchDeliveryFee()
    }

    // Fetch available payment methods when restaurant/shop changes
    if (cart.restaurant || cart.shop) {
      fetchAvailablePaymentMethods()
    }

    // Fetch payment account when payment method changes and it's not COD
    if (paymentMethod !== 'cod' && (cart.restaurant || cart.shop)) {
      fetchPaymentAccount()
    } else {
      setPaymentAccount(null)
      setTransactionId('')
    }
  }, [paymentMethod, cart.restaurant, cart.shop, deliveryAddress.zone, isAuthenticated, authLoading])

  // Reset payment method if current selection is not available
  useEffect(() => {
    if (!availablePaymentMethods.includes(paymentMethod)) {
      setPaymentMethod('cod')
      setPaymentAccount(null)
      setTransactionId('')
    }
  }, [availablePaymentMethods])

  const fetchDeliveryFee = async () => {
    try {
      const res = await axios.get(`/delivery-fees/township/${deliveryAddress.township}`)
      if (res.data.fee) {
        setDeliveryFee(res.data.fee.fee)
      }
    } catch (error) {
      console.error('Error fetching delivery fee:', error)
    }
  }

  const fetchAvailablePaymentMethods = async () => {
    try {
      let paymentAccounts = null
      if (cart.restaurant) {
        const res = await axios.get(`/restaurants/${cart.restaurant._id}`)
        paymentAccounts = res.data.restaurant?.paymentAccounts
      } else if (cart.shop) {
        const res = await axios.get(`/shops/${cart.shop._id}`)
        paymentAccounts = res.data.shop?.paymentAccounts
      }

      // Build list of available payment methods
      const available = ['cod'] // COD is always available
      
      if (paymentAccounts) {
        // Check KBZ Pay
        if (paymentAccounts.kbzpay && 
            paymentAccounts.kbzpay.accountName && 
            paymentAccounts.kbzpay.accountNumber) {
          available.push('kbzpay')
        }
        
        // Check Wave Money
        if (paymentAccounts.wavemoney && 
            paymentAccounts.wavemoney.accountName && 
            (paymentAccounts.wavemoney.phone || paymentAccounts.wavemoney.accountNumber)) {
          available.push('wavemoney')
        }
        
        // Check Bank Transfer
        if (paymentAccounts.bank && 
            paymentAccounts.bank.accountName && 
            paymentAccounts.bank.accountNumber && 
            paymentAccounts.bank.bankName) {
          available.push('bank')
        }
      }

      setAvailablePaymentMethods(available)
    } catch (error) {
      console.error('Error fetching available payment methods:', error)
      setAvailablePaymentMethods(['cod']) // Default to COD only on error
    }
  }

  const fetchPaymentAccount = async () => {
    try {
      if (cart.restaurant) {
        const res = await axios.get(`/restaurants/${cart.restaurant._id}`)
        if (res.data.restaurant?.paymentAccounts?.[paymentMethod]) {
          setPaymentAccount(res.data.restaurant.paymentAccounts[paymentMethod])
        } else {
          setPaymentAccount(null)
        }
      } else if (cart.shop) {
        const res = await axios.get(`/shops/${cart.shop._id}`)
        if (res.data.shop?.paymentAccounts?.[paymentMethod]) {
          setPaymentAccount(res.data.shop.paymentAccounts[paymentMethod])
        } else {
          setPaymentAccount(null)
        }
      }
    } catch (error) {
      console.error('Error fetching payment account:', error)
      setPaymentAccount(null)
    }
  }

  const handleCheckout = async () => {
    if (!deliveryAddress.street || !deliveryAddress.township || !deliveryAddress.phone) {
      alert('Please fill in all delivery address fields')
      return
    }

    if (cart.items.length === 0) {
      alert('Cart is empty')
      return
    }

    // Validate transaction ID for online payments
    if (paymentMethod !== 'cod') {
      if (!transactionId || transactionId.length !== 6 || !/^\d{6}$/.test(transactionId)) {
        alert('Please enter a valid 6-digit transaction ID')
        return
      }
    }

    setLoading(true)
    try {
      const orderData = {
        items: cart.items.map(item => ({
          itemId: item.itemId,
          itemType: item.itemType,
          name: item.name,
          nameMyanmar: item.nameMyanmar,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        restaurant: cart.restaurant?._id,
        shop: cart.shop?._id,
        deliveryAddress,
        paymentMethod,
        transactionId: paymentMethod !== 'cod' ? transactionId : null,
        subtotal: getCartTotal(),
        deliveryFee
      }

      const res = await axios.post('/orders', orderData)
      clearCart()
      navigate(`/orders/${res.data.order._id}`)
    } catch (error) {
      console.error('Error creating order:', error)
      const errorMessage = error.response?.data?.message || 'Failed to create order. Please try again.'
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

  if (cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <p className="text-gray-600 text-base mb-6">Your cart is empty</p>
        <button
          onClick={() => navigate('/restaurants')}
          className="bg-primary text-white px-8 py-3.5 rounded-lg hover:bg-primary-dark active:bg-primary-dark transition font-semibold touch-manipulation min-h-[44px]"
        >
          Browse Restaurants
        </button>
      </div>
    )
  }

  const total = getCartTotal() + deliveryFee

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 md:py-8 pb-20 sm:pb-8 safe-area-bottom">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 md:mb-6">Cart</h1>

      <div className="grid lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Items</h2>
            {cart.items.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 pb-4 mb-4 last:mb-0 last:border-0 gap-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0 w-full sm:w-auto">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{item.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate mb-1">{item.nameMyanmar}</p>
                    <p className="text-primary font-bold text-sm sm:text-base">{item.price} Ks</p>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => updateQuantity(item.itemId, item.itemType, item.quantity - 1)}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition font-semibold text-base touch-manipulation flex items-center justify-center"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm sm:text-base font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.itemId, item.itemType, item.quantity + 1)}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition font-semibold text-base touch-manipulation flex items-center justify-center"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.itemId, item.itemType)}
                    className="text-red-500 hover:text-red-700 active:text-red-800 text-sm sm:text-base px-3 py-2 rounded-lg hover:bg-red-50 active:bg-red-100 transition touch-manipulation min-h-[44px]"
                    aria-label="Remove item"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4">Delivery Address</h2>
            <div className="space-y-3 md:space-y-4">
              <input
                type="text"
                placeholder="Street Address"
                value={deliveryAddress.street}
                onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                className="w-full px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                placeholder="Township"
                value={deliveryAddress.township}
                onChange={(e) => setDeliveryAddress({ ...deliveryAddress, township: e.target.value })}
                className="w-full px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <select
                value={deliveryAddress.zone}
                onChange={(e) => setDeliveryAddress({ ...deliveryAddress, zone: e.target.value })}
                className="w-full px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select Zone</option>
                <option value="ဗဟိုခရိုင်">ဗဟိုခရိုင်</option>
                <option value="အရှေ့ပိုင်း">အရှေ့ပိုင်း</option>
                <option value="အနောက်ပိုင်း">အနောက်ပိုင်း</option>
                <option value="အဝေးပိုင်း">အဝေးပိုင်း</option>
              </select>
              <input
                type="tel"
                placeholder="Phone Number"
                value={deliveryAddress.phone}
                onChange={(e) => setDeliveryAddress({ ...deliveryAddress, phone: e.target.value })}
                className="w-full px-4 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow p-4 md:p-6 lg:sticky lg:top-20">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{getCartTotal()} Ks</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-medium">{deliveryFee} Ks</span>
              </div>
              <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between font-bold text-base sm:text-lg">
                <span>Total</span>
                <span className="text-primary">{total} Ks</span>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Payment Method</h3>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary touch-manipulation"
              >
                {availablePaymentMethods.includes('cod') && (
                  <option value="cod">Cash on Delivery</option>
                )}
                {availablePaymentMethods.includes('kbzpay') && (
                  <option value="kbzpay">KBZ Pay</option>
                )}
                {availablePaymentMethods.includes('wavemoney') && (
                  <option value="wavemoney">Wave Money</option>
                )}
                {availablePaymentMethods.includes('bank') && (
                  <option value="bank">Bank Transfer</option>
                )}
              </select>
              {availablePaymentMethods.length === 1 && (
                <p className="text-xs text-gray-500 mt-1">
                  Only Cash on Delivery is available for this restaurant/shop
                </p>
              )}
            </div>

            {/* Payment Account Details */}
            {paymentMethod !== 'cod' && paymentAccount && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold mb-2 text-blue-800">💳 Payment Account Details</h3>
                {paymentMethod === 'kbzpay' && (
                  <div className="space-y-1 text-sm">
                    <p><span className="font-semibold">Account Name:</span> {paymentAccount.accountName}</p>
                    <p><span className="font-semibold">Account Number:</span> {paymentAccount.accountNumber}</p>
                    {paymentAccount.phone && <p><span className="font-semibold">Phone:</span> {paymentAccount.phone}</p>}
                  </div>
                )}
                {paymentMethod === 'wavemoney' && (
                  <div className="space-y-1 text-sm">
                    <p><span className="font-semibold">Account Name:</span> {paymentAccount.accountName}</p>
                    <p><span className="font-semibold">Phone Number:</span> {paymentAccount.phone || paymentAccount.accountNumber}</p>
                  </div>
                )}
                {paymentMethod === 'bank' && (
                  <div className="space-y-1 text-sm">
                    <p><span className="font-semibold">Account Name:</span> {paymentAccount.accountName}</p>
                    <p><span className="font-semibold">Account Number:</span> {paymentAccount.accountNumber}</p>
                    <p><span className="font-semibold">Bank:</span> {paymentAccount.bankName}</p>
                    {paymentAccount.branch && <p><span className="font-semibold">Branch:</span> {paymentAccount.branch}</p>}
                  </div>
                )}
                <p className="mt-2 text-xs text-gray-600">Please transfer {total} Ks to the above account</p>
              </div>
            )}

            {/* Transaction ID Input */}
            {paymentMethod !== 'cod' && (
              <div className="mb-4">
                <label className="block font-semibold mb-2 text-sm sm:text-base">
                  Transaction ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter 6-digit transaction ID"
                  value={transactionId}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setTransactionId(value)
                  }}
                  maxLength={6}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary touch-manipulation"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Enter the 6-digit transaction ID from your payment receipt
                </p>
              </div>
            )}

            {paymentMethod !== 'cod' && !paymentAccount && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Payment account information is not available. Please contact the restaurant/shop.
                </p>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading || (paymentMethod !== 'cod' && (!paymentAccount || !transactionId || transactionId.length !== 6))}
              className="w-full bg-primary text-white py-4 rounded-lg hover:bg-primary-dark active:bg-primary-dark transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[52px] text-base sm:text-lg shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Place Order'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

