import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Restaurants from './pages/Restaurants'
import RestaurantDetail from './pages/RestaurantDetail'
import Shops from './pages/Shops'
import ShopDetail from './pages/ShopDetail'
import Riders from './pages/Riders'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import DeliveryFees from './pages/DeliveryFees'
import Users from './pages/Users'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'
import Withdrawals from './pages/Withdrawals'
import Login from './pages/Login'

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/restaurants" element={<ProtectedRoute><Restaurants /></ProtectedRoute>} />
              <Route path="/restaurants/:id" element={<ProtectedRoute><RestaurantDetail /></ProtectedRoute>} />
              <Route path="/shops" element={<ProtectedRoute><Shops /></ProtectedRoute>} />
              <Route path="/shops/:id" element={<ProtectedRoute><ShopDetail /></ProtectedRoute>} />
              <Route path="/riders" element={<ProtectedRoute><Riders /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
              <Route path="/delivery-fees" element={<ProtectedRoute><DeliveryFees /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/withdrawals" element={<ProtectedRoute><Withdrawals /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App

