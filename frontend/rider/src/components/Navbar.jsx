import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMobileMenuOpen(false)
  }

  const closeMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 safe-area-top">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link to="/" className="flex items-center space-x-2 min-w-0 flex-shrink">
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary truncate">SEA EXPRESS</span>
            <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">Rider</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
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
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition font-semibold"
                >
                  Logout
                </button>
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

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2 sm:space-x-3">
            {isAuthenticated && (
              <div className="p-1">
                <NotificationBell />
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-text hover:text-primary transition p-2 -mr-1 touch-manipulation"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Backdrop */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
            onClick={closeMenu}
          />
        )}

        {/* Mobile Menu Sidebar */}
        <div
          className={`lg:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full pt-14 safe-area-top">
            {/* Menu Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-bold text-primary">Rider Menu</h2>
              <button
                onClick={closeMenu}
                className="p-2 text-gray-600 hover:text-gray-900 touch-manipulation"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-2">
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/" 
                    className="flex items-center text-base text-text hover:bg-gray-50 active:bg-gray-100 transition px-4 py-3.5 touch-manipulation"
                    onClick={closeMenu}
                  >
                    <span className="text-xl mr-3">📊</span>
                    <span>Dashboard</span>
                  </Link>
                  <Link 
                    to="/orders/available" 
                    className="flex items-center text-base text-text hover:bg-gray-50 active:bg-gray-100 transition px-4 py-3.5 touch-manipulation"
                    onClick={closeMenu}
                  >
                    <span className="text-xl mr-3">📦</span>
                    <span>Available Orders</span>
                  </Link>
                  <Link 
                    to="/orders" 
                    className="flex items-center text-base text-text hover:bg-gray-50 active:bg-gray-100 transition px-4 py-3.5 touch-manipulation"
                    onClick={closeMenu}
                  >
                    <span className="text-xl mr-3">📋</span>
                    <span>My Orders</span>
                  </Link>
                  <Link 
                    to="/stats" 
                    className="flex items-center text-base text-text hover:bg-gray-50 active:bg-gray-100 transition px-4 py-3.5 touch-manipulation"
                    onClick={closeMenu}
                  >
                    <span className="text-xl mr-3">📈</span>
                    <span>Stats</span>
                  </Link>
                  <Link 
                    to="/withdrawal" 
                    className="flex items-center text-base text-text hover:bg-gray-50 active:bg-gray-100 transition px-4 py-3.5 touch-manipulation"
                    onClick={closeMenu}
                  >
                    <span className="text-xl mr-3">💰</span>
                    <span>Withdraw</span>
                  </Link>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link 
                    to="/profile" 
                    className="flex items-center text-base text-text hover:bg-gray-50 active:bg-gray-100 transition px-4 py-3.5 touch-manipulation"
                    onClick={closeMenu}
                  >
                    <span className="text-xl mr-3">👤</span>
                    <span className="truncate">{user?.name || 'Profile'}</span>
                  </Link>
                  <div className="border-t border-gray-200 my-2"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full bg-primary text-white px-4 py-3.5 rounded-lg hover:bg-primary-dark active:bg-primary-dark transition font-semibold text-left mx-4 my-2 touch-manipulation"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center text-base text-text hover:bg-gray-50 active:bg-gray-100 transition px-4 py-3.5 touch-manipulation"
                    onClick={closeMenu}
                  >
                    <span className="text-xl mr-3">🔐</span>
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/register"
                    className="bg-primary text-white px-4 py-3.5 rounded-lg hover:bg-primary-dark active:bg-primary-dark transition font-semibold text-center mx-4 my-2 touch-manipulation"
                    onClick={closeMenu}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

