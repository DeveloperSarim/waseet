import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { statusApi } from '../lib/api'

// Redirects non-admin users to /maintenance when the platform is in maintenance
// mode. Admins are never gated (they need the console to turn it back off).
export function useMaintenanceGate(active = true) {
  const { user, loading } = useAuth() || {}
  const navigate = useNavigate()
  useEffect(() => {
    if (!active || loading) return
    if (user?.role === 'ADMIN') return
    let alive = true
    statusApi.get().then((s) => { if (alive && s?.maintenance) navigate('/maintenance', { replace: true }) }).catch(() => {})
    return () => { alive = false }
  }, [active, loading, user, navigate])
}
