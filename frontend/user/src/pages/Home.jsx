import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

export default function Home() {
  const { isAuthenticated } = useAuth()
  const [popularRestaurants, setPopularRestaurants] = useState([])
  const [popularShops, setPopularShops] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPopularItems()
  }, [])

  const fetchPopularItems = async () => {
    try {
      const [restaurantsRes, shopsRes] = await Promise.all([
        axios.get('/restaurants'),
        axios.get('/shops')
      ])
      
      // Get top 6 by rating
      const restaurants = restaurantsRes.data.restaurants
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6)
      
      const shops = shopsRes.data.shops
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6)
      
      setPopularRestaurants(restaurants)
      setPopularShops(shops)
    } catch (error) {
      console.error('Error fetching popular items:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary via-pink-500 to-secondary text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-6xl md:text-7xl font-bold mb-4 drop-shadow-lg">SEA EXPRESS</h1>
          <p className="text-xl md:text-2xl mb-2 font-semibold">အတွင်းမြို့နယ်အလိုက် အစားအသောက်၊ ကုန်ပစ္စည်းများ ပို့ဆောင်ပေးခြင်း</p>
          <p className="text-lg mb-8 text-gray-100">Fast, Reliable, and Convenient Delivery Service</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/restaurants"
              className="bg-white text-primary px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition transform hover:scale-105 shadow-lg text-lg"
            >
              🍽️ Browse Restaurants
            </Link>
            <Link
              to="/shops"
              className="bg-accent text-white px-8 py-4 rounded-lg font-bold hover:bg-green-600 transition transform hover:scale-105 shadow-lg text-lg"
            >
              🛍️ Browse Shops
            </Link>
            <Link
              to="/delivery"
              className="bg-secondary text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-600 transition transform hover:scale-105 shadow-lg text-lg"
            >
              📦 User-to-User Delivery
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100+</div>
              <div className="text-gray-600">Restaurants</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-secondary mb-2">50+</div>
              <div className="text-gray-600">Shops</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">500+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-gray-600">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-text">Why Choose SEA EXPRESS?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition">
            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🚚</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
            <p className="text-gray-600">Quick and reliable delivery service within your township</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition">
            <div className="bg-secondary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">💳</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Multiple Payment Options</h3>
            <p className="text-gray-600">COD, KBZ Pay, Wave Money, Bank Transfer</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition">
            <div className="bg-accent/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">⭐</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Quality Service</h3>
            <p className="text-gray-600">Rated restaurants and shops with verified reviews</p>
          </div>
        </div>
      </section>

      {/* Popular Restaurants */}
      {!loading && popularRestaurants.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-text">⭐ Popular Restaurants</h2>
              <Link
                to="/restaurants"
                className="text-primary hover:text-primary-dark font-semibold"
              >
                View All →
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularRestaurants.map((restaurant) => (
                <Link
                  key={restaurant._id}
                  to={`/restaurants/${restaurant._id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1"
                >
                  {(restaurant.profileImage || restaurant.images?.[0]) && (
                    <img
                      src={restaurant.profileImage || restaurant.images[0]}
                      alt={restaurant.name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    {/* Active Promotions */}
                    {restaurant.promotions && restaurant.promotions.length > 0 && (() => {
                      const now = new Date()
                      const activePromo = restaurant.promotions.find(p => {
                        if (!p.isActive) return false
                        const start = new Date(p.startDate)
                        const end = new Date(p.endDate)
                        return now >= start && now <= end
                      })
                      return activePromo ? (
                        <div className="mb-2 p-1 bg-red-500 text-white rounded text-xs font-bold text-center">
                          🎉 {activePromo.discountPercentage}% OFF
                        </div>
                      ) : null
                    })()}
                    
                    <h3 className="text-xl font-semibold mb-1">{restaurant.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{restaurant.nameMyanmar}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-yellow-500 text-lg">⭐</span>
                        <span className="ml-1 font-semibold">{restaurant.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-gray-500 text-sm">{restaurant.address?.township}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Shops */}
      {!loading && popularShops.length > 0 && (
        <section className="py-16 container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-text">🛍️ Popular Shops</h2>
            <Link
              to="/shops"
              className="text-primary hover:text-primary-dark font-semibold"
            >
              View All →
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularShops.map((shop) => (
              <Link
                key={shop._id}
                to={`/shops/${shop._id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1"
              >
                {(shop.profileImage || shop.images?.[0]) && (
                  <img
                    src={shop.profileImage || shop.images[0]}
                    alt={shop.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  {/* Active Promotions */}
                  {shop.promotions && shop.promotions.length > 0 && (() => {
                    const now = new Date()
                    const activePromo = shop.promotions.find(p => {
                      if (!p.isActive) return false
                      const start = new Date(p.startDate)
                      const end = new Date(p.endDate)
                      return now >= start && now <= end
                    })
                    return activePromo ? (
                      <div className="mb-2 p-1 bg-red-500 text-white rounded text-xs font-bold text-center">
                        🎉 {activePromo.discountPercentage}% OFF
                      </div>
                    ) : null
                  })()}
                  
                  <h3 className="text-xl font-semibold mb-1">{shop.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{shop.nameMyanmar}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-yellow-500 text-lg">⭐</span>
                      <span className="ml-1 font-semibold">{shop.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-gray-500 text-sm">{shop.address?.township}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Delivery Zones */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-text">Delivery Zones (Yangon)</h2>
          <p className="text-center text-gray-600 mb-12">Affordable delivery fees based on your location</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition text-center">
              <div className="text-4xl mb-3">🏙️</div>
              <h3 className="font-semibold text-lg mb-2">ဗဟိုခရိုင်</h3>
              <p className="text-primary text-3xl font-bold mb-1">2,500 Ks</p>
              <p className="text-sm text-gray-500">Central District</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition text-center">
              <div className="text-4xl mb-3">🌅</div>
              <h3 className="font-semibold text-lg mb-2">အရှေ့ပိုင်း</h3>
              <p className="text-primary text-3xl font-bold mb-1">3,000 Ks</p>
              <p className="text-sm text-gray-500">East Zone</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition text-center">
              <div className="text-4xl mb-3">🌇</div>
              <h3 className="font-semibold text-lg mb-2">အနောက်ပိုင်း</h3>
              <p className="text-primary text-3xl font-bold mb-1">3,500 Ks</p>
              <p className="text-sm text-gray-500">West Zone</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition text-center">
              <div className="text-4xl mb-3">🏞️</div>
              <h3 className="font-semibold text-lg mb-2">အဝေးပိုင်း</h3>
              <p className="text-primary text-3xl font-bold mb-1">4,000+ Ks</p>
              <p className="text-sm text-gray-500">Outer Areas</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-secondary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Order?</h2>
          <p className="text-xl mb-8 text-gray-100">Start ordering your favorite food and products now!</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/register"
                  className="bg-white text-primary px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition transform hover:scale-105 shadow-lg text-lg"
                >
                  Create Account
                </Link>
                <Link
                  to="/login"
                  className="bg-accent text-white px-8 py-4 rounded-lg font-bold hover:bg-green-600 transition transform hover:scale-105 shadow-lg text-lg"
                >
                  Login
                </Link>
              </>
            ) : (
              <Link
                to="/restaurants"
                className="bg-white text-primary px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition transform hover:scale-105 shadow-lg text-lg"
              >
                Start Ordering Now
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

