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
        console.log('Socket connected:', newSocket.id)
        // Join user room for order updates
        const userId = user.id || user._id
        if (userId) {
          newSocket.emit('join-room', `user-${userId}`)
          console.log(`Joined room: user-${userId}`)
        }
        // Join users room for promotions
        newSocket.emit('join-room', 'users')
        console.log('Joined room: users')
      })

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected')
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

