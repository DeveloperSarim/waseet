import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { statusApi } from '../lib/api'
import { MaintenancePage } from '../pages/public/StatusPages'

// Gate for pages that only logged-in (trusted, admin-approved) users may see —
// e.g. the private marketplace. While the session is still being restored we
// render nothing; once resolved, unauthenticated users are sent to /login.
//
// The marketplace also goes dark during maintenance (admins always bypass):
//  - full-platform maintenance → redirect to the platform maintenance page
//  - marketplace-only maintenance → show the marketplace maintenance screen in
//    place, so the rest of the user's portal stays reachable.
export function RequireAuth({ children, embedded = false }) {
  const { user, loading } = useAuth() || {}
  const location = useLocation()
  const [gate, setGate] = useState(null) // 'platform' | 'marketplace' | null

  useEffect(() => {
    if (loading || !user) return
    if (user.role === 'ADMIN') { setGate(null); return } // admins bypass maintenance
    let alive = true
    statusApi.get()
      .then((s) => {
        if (!alive) return
        setGate(s?.maintenance ? 'platform' : s?.marketplaceMaintenance ? 'marketplace' : null)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [loading, user])

  if (loading) return null
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (gate === 'platform') return <Navigate to="/maintenance" replace />
  if (gate === 'marketplace') return <MaintenancePage scope="marketplace" embedded={embedded} />
  return children
}

export default RequireAuth
