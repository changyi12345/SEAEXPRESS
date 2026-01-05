import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'

export default function ShopDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const { socket } = useSocket()
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    fetchShop()
  }, [id])

  // Listen for new promotions
  useEffect(() => {
    if (!socket) return

    const handleNewPromotion = (data) => {
      if (data.shop && data.shop._id === id) {
        setNotification({
          type: 'promotion',
          message: `🎉 New Promotion: ${data.promotion.title} - ${data.promotion.discountPercentage}% OFF!`,
          promotion: data.promotion
        })
        fetchShop() // Refresh shop data
        setTimeout(() => setNotification(null), 5000)
      }
    }

    socket.on('new-promotion', handleNewPromotion)

    return () => {
      socket.off('new-promotion', handleNewPromotion)
    }
  }, [socket, id])

  const fetchShop = async () => {
    try {
      const res = await axios.get(`/shops/${id}`)
      setShop(res.data.shop)
    } catch (error) {
      console.error('Error fetching shop:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (item) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    addToCart({
      _id: item._id,
      name: item.name,
      nameMyanmar: item.nameMyanmar,
      price: item.price,
      image: item.image,
      quantity: 1
    }, 'shop', {
      _id: shop._id,
      name: shop.name,
      nameMyanmar: shop.nameMyanmar
    })
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  if (!shop) {
    return <div className="container mx-auto px-4 py-8 text-center">Shop not found</div>
  }

  // Check if shop is closed today
  const isClosedToday = () => {
    if (!shop?.closingDays || shop.closingDays.length === 0) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return shop.closingDays.some(day => {
      const closingDate = new Date(day.date)
      closingDate.setHours(0, 0, 0, 0)
      return closingDate.getTime() === today.getTime()
    })
  }

  // Get active promotions
  const getActivePromotions = () => {
    if (!shop?.promotions) return []
    const now = new Date()
    return shop.promotions.filter(promo => {
      if (!promo.isActive) return false
      const startDate = new Date(promo.startDate)
      const endDate = new Date(promo.endDate)
      return now >= startDate && now <= endDate
    })
  }

  const activePromotions = getActivePromotions()
  const closedToday = isClosedToday()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Promotion Notification */}
      {notification && (
        <div className="mb-4 p-4 bg-green-100 border-2 border-green-500 rounded-lg">
          <p className="font-bold text-green-800">{notification.message}</p>
        </div>
      )}

      {/* Closed Today Notice */}
      {closedToday && (
        <div className="mb-4 p-4 bg-red-100 border-2 border-red-500 rounded-lg">
          <p className="font-bold text-red-800">🚫 This shop is closed today</p>
          {shop.closingDays.find(day => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const closingDate = new Date(day.date)
            closingDate.setHours(0, 0, 0, 0)
            return closingDate.getTime() === today.getTime()
          })?.reason && (
            <p className="text-sm text-red-700 mt-1">
              {shop.closingDays.find(day => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const closingDate = new Date(day.date)
                closingDate.setHours(0, 0, 0, 0)
                return closingDate.getTime() === today.getTime()
              })?.reason}
            </p>
          )}
        </div>
      )}

      {/* Active Promotions */}
      {activePromotions.length > 0 && (
        <div className="mb-6 space-y-3">
          {activePromotions.map((promo) => (
            <div key={promo._id} className="p-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xl mb-1">{promo.title}</h3>
                  {promo.titleMyanmar && <p className="text-sm opacity-90 mb-1">{promo.titleMyanmar}</p>}
                  {promo.description && <p className="text-sm opacity-80">{promo.description}</p>}
                </div>
                <div className="text-right">
                  <div className="bg-white text-red-600 px-4 py-2 rounded-lg font-bold text-2xl">
                    {promo.discountPercentage}% OFF
                  </div>
                  <p className="text-xs mt-1 opacity-80">
                    Until {new Date(promo.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6">
        {(shop.profileImage || shop.images?.[0]) && (
          <img
            src={shop.profileImage || shop.images[0]}
            alt={shop.name}
            className="w-full h-64 object-cover rounded-lg mb-4"
          />
        )}
        <h1 className="text-3xl font-bold mb-2">{shop.name}</h1>
        <p className="text-xl text-gray-600 mb-4">{shop.nameMyanmar}</p>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="text-yellow-500">⭐</span>
            <span className="ml-1">{shop.rating.toFixed(1)}</span>
          </div>
          <span className="text-gray-500">{shop.address?.township}</span>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Products</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shop.products?.filter(item => item.isAvailable && item.stock > 0).map((item) => (
            <div key={item._id} className="bg-white border rounded-lg p-4">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-32 object-cover rounded mb-2"
                />
              )}
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{item.nameMyanmar}</p>
              <div className="flex items-center justify-between mb-2">
                {item.discountPercentage > 0 && item.originalPrice ? (
                  <div className="flex items-center gap-2">
                    <div>
                      <span className="text-sm line-through text-gray-400">{item.originalPrice} Ks</span>
                      <span className="text-primary font-bold ml-2">{item.price} Ks</span>
                    </div>
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      -{item.discountPercentage}%
                    </span>
                  </div>
                ) : (
                  <span className="text-primary font-bold">{item.price} Ks</span>
                )}
              </div>
              <button
                onClick={() => handleAddToCart(item)}
                className="w-full bg-primary text-white px-4 py-1 rounded hover:bg-primary-dark transition"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

