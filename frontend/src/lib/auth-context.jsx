import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  clearAuthToken,
  getCurrentUserRequest,
  hasAuthToken,
  loginRequest,
  saveAuthToken,
  signupRequest,
} from '@/lib/api'

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    if (!hasAuthToken()) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const me = await getCurrentUserRequest()
      setUser({ id: me.id, email: me.email })
    } catch {
      clearAuthToken()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshUser()
  }, [refreshUser])

  const login = useCallback(async (email, password) => {
    const response = await loginRequest(email, password)
    saveAuthToken(response.token)
    setUser(response.user)
  }, [])

  const register = useCallback(async (email, password) => {
    const response = await signupRequest(email, password)
    saveAuthToken(response.token)
    setUser(response.user)
  }, [])

  const logout = useCallback(() => {
    clearAuthToken()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}