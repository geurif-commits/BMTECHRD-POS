import { useEffect, useState } from 'react'
import AuthContext from './AuthContext'
import { getProfile } from '@/api'
import { connectSocket, disconnectSocket } from '@/socket'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }
      
      const response = await getProfile()
      if (response.success && response.data?.user) {
        setUser(response.data.user)
        connectSocket()
      } else {
        setUser(null)
        localStorage.removeItem('token')
        disconnectSocket()
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setUser(null)
      localStorage.removeItem('token')
      disconnectSocket()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
  }, [])

  const login = (userData) => {
    setUser(userData)
    connectSocket()
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    disconnectSocket()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        role: user?.role || null,
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
