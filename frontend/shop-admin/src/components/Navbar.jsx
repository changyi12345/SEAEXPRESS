import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'

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
            <span className="text-sm text-gray-500">Shop Admin</span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center space-x-6">
              <Link to="/" className="text-text hover:text-primary transition">
                Dashboard
              </Link>
              <Link to="/products" className="text-text hover:text-primary transition">
                Products
              </Link>
              <Link to="/orders" className="text-text hover:text-primary transition">
                Orders
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
                      {user?.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                  )}
                  <span className="font-medium">{user?.name || 'Admin'}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition font-semibold"
                >
                  Logout
                </button>
              </div>
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

