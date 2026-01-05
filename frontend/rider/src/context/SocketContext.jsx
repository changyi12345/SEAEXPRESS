import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider')
  }
  return context
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    if (isAuthenticated && user && (user.id || user._id)) {
      // Connect to socket server
      const newSocket = io(API_URL, {
        transports: ['websocket', 'polling']
      })

      newSocket.on('connect', () => {
        console.log('Rider Socket connected:', newSocket.id)
        // Join rider room for updates
        const userId = user.id || user._id
        if (userId) {
          newSocket.emit('join-room', `rider-${userId}`)
          console.log(`Joined room: rider-${userId}`)
        }
        // Join general riders room to receive new order notifications
        newSocket.emit('join-room', 'riders')
        console.log('Joined room: riders')
      })

      newSocket.on('disconnect', () => {
        console.log('Rider Socket disconnected')
      })

      newSocket.on('error', (error) => {
        console.error('Socket error:', error)
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    } else {
      // Disconnect if user logs out
      if (socket) {
        socket.close()
        setSocket(null)
      }
    }
  }, [isAuthenticated, user?.id, user?._id])

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  )
}

