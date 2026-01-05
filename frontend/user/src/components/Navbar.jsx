import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const { getCartCount } = useCart()
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
    navigate('/')
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
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-6">
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
                    <span className="font-medium hidden xl:inline">{user?.name || 'User'}</span>
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

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-2 sm:space-x-3">
            {isAuthenticated && (
              <>
                <Link to="/cart" className="relative text-text hover:text-primary transition p-2 -mr-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {getCartCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {getCartCount()}
                    </span>
                  )}
                </Link>
                <div className="p-1">
                  <NotificationBell />
                </div>
              </>
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
              <h2 className="text-lg font-bold text-primary">Menu</h2>
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
              <Link 
                to="/restaurants" 
                className="flex items-center text-base text-text hover:bg-gray-50 active:bg-gray-100 transition px-4 py-3.5 touch-manipulation"
                onClick={closeMenu}
              >
                <span className="text-xl mr-3">🍽️</span>
                <span>Restaurants</span>
              </Link>
              <Link 
                to="/shops" 
                className="flex items-center text-base text-text hover:bg-gray-50 active:bg-gray-100 transition px-4 py-3.5 touch-manipulation"
                onClick={closeMenu}
              >
                <span className="text-xl mr-3">🛍️</span>
                <span>Shops</span>
              </Link>
              <Link 
                to="/delivery" 
                className="flex items-center text-base text-text hover:bg-gray-50 active:bg-gray-100 transition px-4 py-3.5 touch-manipulation"
                onClick={closeMenu}
              >
                <span className="text-xl mr-3">📦</span>
                <span>Delivery</span>
              </Link>
              
              {isAuthenticated ? (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link 
                    to="/orders" 
                    className="flex items-center text-base text-text hover:bg-gray-50 active:bg-gray-100 transition px-4 py-3.5 touch-manipulation"
                    onClick={closeMenu}
                  >
                    <span className="text-xl mr-3">📋</span>
                    <span>Orders</span>
                  </Link>
                  <Link 
                    to="/profile" 
                    className="flex items-center space-x-3 text-base text-text hover:bg-gray-50 active:bg-gray-100 transition px-4 py-3.5 touch-manipulation"
                    onClick={closeMenu}
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover border-2 border-primary flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="font-medium truncate">{user?.name || 'User'}</span>
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
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="flex flex-col space-y-2 px-4">
                    <Link
                      to="/login"
                      className="text-base text-text hover:bg-gray-50 active:bg-gray-100 transition px-4 py-3 rounded-lg text-center touch-manipulation"
                      onClick={closeMenu}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="bg-primary text-white px-4 py-3.5 rounded-lg hover:bg-primary-dark active:bg-primary-dark transition font-semibold text-center touch-manipulation"
                      onClick={closeMenu}
                    >
                      Register
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

