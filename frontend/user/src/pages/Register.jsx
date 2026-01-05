import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    const result = await register({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: 'user'
    })

    if (result.success) {
      navigate('/')
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 md:py-12 px-3 sm:px-4 safe-area-top safe-area-bottom">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 md:p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-primary">Register</h2>
          <p className="text-gray-600 text-sm">Create your account to get started</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-800 p-3.5 rounded-lg mb-4 text-sm">
            <span className="font-semibold">⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 font-semibold text-sm sm:text-base text-gray-700">Name</label>
            <input
              type="text"
              autoComplete="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary touch-manipulation"
              placeholder="Your full name"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-sm sm:text-base text-gray-700">Email</label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary touch-manipulation"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-sm sm:text-base text-gray-700">Phone</label>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary touch-manipulation"
              placeholder="09xxxxxxxxx"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-sm sm:text-base text-gray-700">Password</label>
            <input
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary touch-manipulation"
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-sm sm:text-base text-gray-700">Confirm Password</label>
            <input
              type="password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary touch-manipulation"
              placeholder="Confirm your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-4 rounded-lg hover:bg-primary-dark active:bg-primary-dark transition font-semibold text-base sm:text-lg touch-manipulation min-h-[52px] shadow-lg mt-2"
          >
            Register
          </button>
        </form>

        <p className="text-center mt-6 text-sm sm:text-base text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

