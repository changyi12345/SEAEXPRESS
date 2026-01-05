import { useState, useEffect } from 'react'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

export default function NotificationBell() {
  const { socket } = useSocket()
  const { isAuthenticated, user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications()
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (!socket || !isAuthenticated) return

    const handleNotification = (notification) => {
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
    }

    socket.on('admin-notification', handleNotification)

    return () => {
      socket.off('admin-notification', handleNotification)
    }
  }, [socket, isAuthenticated])

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/shop-owners/notifications')
      setNotifications(res.data.notifications || [])
      const userId = user?._id || user?.id
      const unread = res.data.notifications?.filter(n => 
        !n.readBy?.some(r => {
          const readUserId = r.user?._id || r.user?.id || r.user
          return readUserId?.toString() === userId?.toString()
        })
      ).length || 0
      setUnreadCount(unread)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/shop-owners/notifications/${notificationId}/read`)
      setNotifications(prev => prev.map(n => 
        n._id === notificationId 
          ? { ...n, readBy: [...(n.readBy || []), { user: { _id: user?._id || user?.id } }] }
          : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800 border-green-300'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'error': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-blue-100 text-blue-800 border-blue-300'
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-700 hover:text-primary transition"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Notifications</h3>
            </div>
            <div className="divide-y">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No notifications</div>
              ) : (
                notifications.slice(0, 10).map(notification => {
                  const userId = user?._id || user?.id
                  const isRead = notification.readBy?.some(r => {
                    const readUserId = r.user?._id || r.user?.id || r.user
                    return readUserId?.toString() === userId?.toString()
                  })
                  return (
                    <div
                      key={notification._id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${!isRead ? 'bg-blue-50' : ''}`}
                      onClick={() => {
                        if (!isRead) markAsRead(notification._id)
                      }}
                    >
                      <div className={`p-3 rounded-lg border ${getTypeColor(notification.type)}`}>
                        <h4 className="font-semibold mb-1">{notification.title}</h4>
                        {notification.titleMyanmar && (
                          <p className="text-sm opacity-90 mb-1">{notification.titleMyanmar}</p>
                        )}
                        <p className="text-sm">{notification.message}</p>
                        {notification.messageMyanmar && (
                          <p className="text-xs opacity-80 mt-1">{notification.messageMyanmar}</p>
                        )}
                        <p className="text-xs opacity-70 mt-2">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

