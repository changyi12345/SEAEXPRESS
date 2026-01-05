import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

export default function Shops() {
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [townshipFilter, setTownshipFilter] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const [sortBy, setSortBy] = useState('rating')

  useEffect(() => {
    fetchShops()
  }, [search, townshipFilter, zoneFilter, sortBy])

  const fetchShops = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (townshipFilter) params.township = townshipFilter
      if (zoneFilter) params.zone = zoneFilter
      
      const res = await axios.get('/shops', { params })
      let filtered = res.data.shops

      // Client-side sorting
      if (sortBy === 'rating') {
        filtered.sort((a, b) => b.rating - a.rating)
      } else if (sortBy === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name))
      }

      setShops(filtered)
    } catch (error) {
      console.error('Error fetching shops:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-text">Shops</h1>
      
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search shops..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={townshipFilter}
            onChange={(e) => setTownshipFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Townships</option>
            <option value="Bahan">Bahan</option>
            <option value="Dagon">Dagon</option>
            <option value="Kamayut">Kamayut</option>
            <option value="Kyauktada">Kyauktada</option>
            <option value="Latha">Latha</option>
            <option value="Pabedan">Pabedan</option>
            <option value="Sanchaung">Sanchaung</option>
            <option value="Tamwe">Tamwe</option>
          </select>
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Zones</option>
            <option value="ဗဟိုခရိုင်">ဗဟိုခရိုင်</option>
            <option value="အရှေ့ပိုင်း">အရှေ့ပိုင်း</option>
            <option value="အနောက်ပိုင်း">အနောက်ပိုင်း</option>
            <option value="အဝေးပိုင်း">အဝေးပိုင်း</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="rating">Sort by Rating</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.map((shop) => (
          <Link
            key={shop._id}
            to={`/shops/${shop._id}`}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
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
                  <div className="mb-2 p-2 bg-red-500 text-white rounded text-xs font-bold text-center">
                    🎉 {activePromo.discountPercentage}% OFF
                  </div>
                ) : null
              })()}
              
              {/* Closed Today Badge */}
              {shop.closingDays && shop.closingDays.length > 0 && (() => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const isClosed = shop.closingDays.some(day => {
                  const closingDate = new Date(day.date)
                  closingDate.setHours(0, 0, 0, 0)
                  return closingDate.getTime() === today.getTime()
                })
                return isClosed ? (
                  <div className="mb-2 p-2 bg-red-600 text-white rounded text-xs font-bold text-center">
                    🚫 Closed Today
                  </div>
                ) : null
              })()}

              <h3 className="text-xl font-semibold mb-2">{shop.name}</h3>
              <p className="text-gray-600 mb-2">{shop.nameMyanmar}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-yellow-500">⭐</span>
                  <span className="ml-1">{shop.rating.toFixed(1)}</span>
                </div>
                <span className="text-gray-500 text-sm">{shop.address?.township}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {shops.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No shops found</p>
        </div>
      )}
    </div>
  )
}

