import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">SEA EXPRESS</span>
            <span className="text-sm text-gray-500">Admin</span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center space-x-6">
              <Link to="/" className="text-text hover:text-primary transition">
                Dashboard
              </Link>
              <Link to="/users" className="text-text hover:text-primary transition">
                Users
              </Link>
              <Link to="/restaurants" className="text-text hover:text-primary transition">
                Restaurants
              </Link>
              <Link to="/shops" className="text-text hover:text-primary transition">
                Shops
              </Link>
              <Link to="/riders" className="text-text hover:text-primary transition">
                Riders
              </Link>
              <Link to="/orders" className="text-text hover:text-primary transition">
                Orders
              </Link>
              <Link to="/delivery-fees" className="text-text hover:text-primary transition">
                Delivery Fees
              </Link>
              <Link to="/withdrawals" className="text-text hover:text-primary transition">
                Withdrawals
              </Link>
              <Link to="/notifications" className="text-text hover:text-primary transition">
                Notifications
              </Link>
              <Link to="/profile" className="text-text hover:text-primary transition">
                Profile
              </Link>
              <Link to="/settings" className="text-text hover:text-primary transition">
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

