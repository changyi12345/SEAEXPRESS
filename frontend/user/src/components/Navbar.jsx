import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const { getCartCount } = useCart()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">SEA EXPRESS</span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link to="/restaurants" className="text-text hover:text-primary transition">
              Restaurants
            </Link>
            <Link to="/shops" className="text-text hover:text-primary transition">
              Shops
            </Link>
            <Link to="/delivery" className="text-text hover:text-primary transition">
              Delivery
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/orders" className="text-text hover:text-primary transition">
                  Orders
                </Link>
                <Link to="/cart" className="relative text-text hover:text-primary transition">
                  Cart
                  {getCartCount() > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {getCartCount()}
                    </span>
                  )}
                </Link>
                <NotificationBell />
                <div className="flex items-center space-x-4">
                  <Link to="/profile" className="flex items-center space-x-3 text-text hover:text-primary transition">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-primary shadow-md"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shadow-md">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="font-medium">{user?.name || 'User'}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition font-semibold"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-text hover:text-primary transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

