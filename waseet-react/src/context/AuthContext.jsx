import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi, setAccessToken } from '../lib/api'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on load using the httpOnly refresh cookie.
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const data = await authApi.refresh()
        if (!alive) return
        setAccessToken(data.accessToken)
        setUser(data.user)
      } catch {
        // no active session — fine
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password)
    setAccessToken(data.accessToken)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    setAccessToken(null)
    setUser(null)
  }, [])

  // Update the logged-in user's own profile and keep context in sync.
  const updateProfile = useCallback(async (payload) => {
    const updated = await authApi.updateMe(payload)
    setUser(updated)
    return updated
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
