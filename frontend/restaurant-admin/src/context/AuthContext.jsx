import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

axios.defaults.baseURL = API_URL

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Initialize token from localStorage
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
    }
    return savedToken
  })

  const fetchUser = useCallback(async () => {
    try {
      const res = await axios.get('/auth/me')
      if (res.data.user) {
        if (res.data.user.role !== 'restaurant-admin' && res.data.user.role !== 'admin') {
          throw new Error('Not a restaurant admin')
        }
        setUser(res.data.user)
      }
    } catch (error) {
      localStorage.removeItem('token')
      setToken(null)
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
      setToken(savedToken)
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [fetchUser])

  const login = async (email, password) => {
    try {
      const res = await axios.post('/auth/login', { email, password })
      const { token: newToken, user: userData } = res.data
      if (userData.role !== 'restaurant-admin' && userData.role !== 'admin') {
        return { success: false, message: 'Not a restaurant admin account' }
      }
      localStorage.setItem('token', newToken)
      setToken(newToken)
      setUser(userData)
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
  }

  const value = {
    user,
    loading,
    login,
    logout,
    fetchUser,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

