import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'

export default function RestaurantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const { socket } = useSocket()
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    fetchRestaurant()
  }, [id])

  // Listen for new promotions
  useEffect(() => {
    if (!socket) return

    const handleNewPromotion = (data) => {
      if (data.restaurant && data.restaurant._id === id) {
        setNotification({
          type: 'promotion',
          message: `🎉 New Promotion: ${data.promotion.title} - ${data.promotion.discountPercentage}% OFF!`,
          promotion: data.promotion
        })
        fetchRestaurant() // Refresh restaurant data
        setTimeout(() => setNotification(null), 5000)
      }
    }

    socket.on('new-promotion', handleNewPromotion)

    return () => {
      socket.off('new-promotion', handleNewPromotion)
    }
  }, [socket, id])

  const fetchRestaurant = async () => {
    try {
      const res = await axios.get(`/restaurants/${id}`)
      setRestaurant(res.data.restaurant)
    } catch (error) {
      console.error('Error fetching restaurant:', error)
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
    }, 'restaurant', {
      _id: restaurant._id,
      name: restaurant.name,
      nameMyanmar: restaurant.nameMyanmar
    })
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  if (!restaurant) {
    return <div className="container mx-auto px-4 py-8 text-center">Restaurant not found</div>
  }

  // Check if restaurant is closed today
  const isClosedToday = () => {
    if (!restaurant?.closingDays || restaurant.closingDays.length === 0) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return restaurant.closingDays.some(day => {
      const closingDate = new Date(day.date)
      closingDate.setHours(0, 0, 0, 0)
      return closingDate.getTime() === today.getTime()
    })
  }

  // Get active promotions
  const getActivePromotions = () => {
    if (!restaurant?.promotions) return []
    const now = new Date()
    return restaurant.promotions.filter(promo => {
      if (!promo.isActive) return false
      const startDate = new Date(promo.startDate)
      const endDate = new Date(promo.endDate)
      return now >= startDate && now <= endDate
    })
  }

  const activePromotions = getActivePromotions()
  const closedToday = isClosedToday()

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      {/* Promotion Notification */}
      {notification && (
        <div className="mb-4 p-3 md:p-4 bg-green-100 border-2 border-green-500 rounded-lg">
          <p className="font-bold text-sm sm:text-base text-green-800">{notification.message}</p>
        </div>
      )}

      {/* Closed Today Notice */}
      {closedToday && (
        <div className="mb-4 p-3 md:p-4 bg-red-100 border-2 border-red-500 rounded-lg">
          <p className="font-bold text-sm sm:text-base text-red-800">🚫 This restaurant is closed today</p>
          {restaurant.closingDays.find(day => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const closingDate = new Date(day.date)
            closingDate.setHours(0, 0, 0, 0)
            return closingDate.getTime() === today.getTime()
          })?.reason && (
            <p className="text-sm text-red-700 mt-1">
              {restaurant.closingDays.find(day => {
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
        <div className="mb-4 md:mb-6 space-y-3">
          {activePromotions.map((promo) => (
            <div key={promo._id} className="p-3 md:p-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg sm:text-xl mb-1">{promo.title}</h3>
                  {promo.titleMyanmar && <p className="text-xs sm:text-sm opacity-90 mb-1">{promo.titleMyanmar}</p>}
                  {promo.description && <p className="text-xs sm:text-sm opacity-80">{promo.description}</p>}
                </div>
                <div className="text-right sm:text-right">
                  <div className="bg-white text-red-600 px-3 py-2 sm:px-4 rounded-lg font-bold text-xl sm:text-2xl">
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

      <div className="mb-4 md:mb-6">
        {(restaurant.profileImage || restaurant.images?.[0]) && (
          <img
            src={restaurant.profileImage || restaurant.images[0]}
            alt={restaurant.name}
            className="w-full h-48 sm:h-64 object-cover rounded-lg mb-3 md:mb-4"
          />
        )}
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{restaurant.name}</h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-3 md:mb-4">{restaurant.nameMyanmar}</p>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="text-yellow-500 text-lg sm:text-xl">⭐</span>
            <span className="ml-1 text-sm sm:text-base">{restaurant.rating.toFixed(1)}</span>
          </div>
          <span className="text-gray-500 text-sm sm:text-base">{restaurant.address?.township}</span>
        </div>
      </div>

      <div className="mb-6 md:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-3 md:mb-4">Menu</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurant.menu?.filter(item => item.isAvailable).map((item) => (
            <div key={item._id} className="bg-white border rounded-lg p-3 md:p-4 hover:shadow-md transition">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-32 sm:h-40 object-cover rounded mb-2"
                />
              )}
              <h3 className="font-semibold text-sm sm:text-base mb-1">{item.name}</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">{item.nameMyanmar}</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
                {item.discountPercentage > 0 && item.originalPrice ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm line-through text-gray-400">{item.originalPrice} Ks</span>
                      <span className="text-primary font-bold text-sm sm:text-base">{item.price} Ks</span>
                    </div>
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      -{item.discountPercentage}%
                    </span>
                  </div>
                ) : (
                  <span className="text-primary font-bold text-sm sm:text-base">{item.price} Ks</span>
                )}
              </div>
              <button
                onClick={() => handleAddToCart(item)}
                className="w-full bg-primary text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-primary-dark active:bg-primary-dark transition text-sm sm:text-base font-semibold touch-manipulation min-h-[44px] shadow-md"
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

