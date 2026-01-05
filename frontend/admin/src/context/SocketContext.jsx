import { createContext, useContext, useEffect, useState, useRef } from 'react'
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
  const socketRef = useRef(null)

  useEffect(() => {
    // Only connect if authenticated and user exists, and we don't already have a socket
    if (isAuthenticated && user && !socketRef.current) {
      // Connect to socket server
      const newSocket = io(API_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      })

      newSocket.on('connect', () => {
        console.log('Admin Socket connected:', newSocket.id)
        // Join admin room for updates
        newSocket.emit('join-room', 'admin')
        console.log('Joined room: admin')
      })

      newSocket.on('disconnect', (reason) => {
        console.log('Admin Socket disconnected:', reason)
        // Clear ref if it's a manual disconnect or server disconnect
        if (reason === 'io server disconnect' || reason === 'io client disconnect') {
          socketRef.current = null
        }
      })

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Admin Socket reconnected after', attemptNumber, 'attempts')
        // Rejoin admin room after reconnection
        newSocket.emit('join-room', 'admin')
      })

      newSocket.on('error', (error) => {
        console.error('Socket error:', error)
      })

      socketRef.current = newSocket
      setSocket(newSocket)

      return () => {
        if (socketRef.current) {
          socketRef.current.close()
          socketRef.current = null
          setSocket(null)
        }
      }
    } else if (!isAuthenticated || !user) {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.close()
        socketRef.current = null
        setSocket(null)
      }
    }
  }, [isAuthenticated, user?._id]) // Use user._id instead of user object to prevent unnecessary reconnections

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  )
}

