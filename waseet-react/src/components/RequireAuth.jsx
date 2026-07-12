import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useMaintenanceGate } from '../hooks/useMaintenanceGate'

// Gate for pages that only logged-in (trusted, admin-approved) users may see —
// e.g. the private marketplace. While the session is still being restored we
// render nothing; once resolved, unauthenticated users are sent to /login.
export function RequireAuth({ children }) {
  const { user, loading } = useAuth() || {}
  const location = useLocation()
  // marketplace also goes dark during maintenance (admins bypass)
  useMaintenanceGate(!!user)
  if (loading) return null
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

export default RequireAuth
