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
            <span className="text-sm text-gray-500">Rider</span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center space-x-6">
              <Link to="/" className="text-text hover:text-primary transition">
                Dashboard
              </Link>
              <Link to="/orders/available" className="text-text hover:text-primary transition">
                Available Orders
              </Link>
              <Link to="/orders" className="text-text hover:text-primary transition">
                My Orders
              </Link>
              <Link to="/stats" className="text-text hover:text-primary transition">
                Stats
              </Link>
              <Link to="/withdrawal" className="text-text hover:text-primary transition">
                Withdraw
              </Link>
              <NotificationBell />
              <Link to="/profile" className="text-text hover:text-primary transition">
                {user?.name}
              </Link>
              <button
                onClick={handleLogout}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
              >
                Logout
              </button>
            </div>
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
    </nav>
  )
}

