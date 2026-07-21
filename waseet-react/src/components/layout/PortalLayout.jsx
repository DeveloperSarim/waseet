import React, { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Sidebar } from './Sidebar'
import { navConfig } from '../../config/nav'
import { useMaintenanceGate } from '../../hooks/useMaintenanceGate'
import { DrawerContext } from './DrawerContext'
import { CountsContext } from './CountsContext'
import { realtorApi, developerApi } from '../../lib/api'

/**
 * Portal shell: sidebar + a flexible main column that hosts each page.
 * On desktop the sidebar is fixed; on mobile it becomes a slide-in drawer
 * toggled by the Topbar hamburger (see globalStyles .wa-sidebar / .wa-open).
 */
export function PortalLayout({ role }) {
  const config = navConfig[role]
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [counts, setCounts] = useState({ notifications: null, leads: null })
  // realtor/developer portals go dark during maintenance; admin never does
  useMaintenanceGate(role !== 'admin')
  // close the drawer whenever the route changes
  useEffect(() => { setDrawerOpen(false) }, [location.pathname])

  // live sidebar/topbar badge counts (unread notifications + open leads)
  const refresh = useCallback(async () => {
    const api = role === 'developer' ? developerApi : role === 'realtor' ? realtorApi : null
    if (!api) return
    const [notif, leads] = await Promise.all([
      api.listNotifications().catch(() => null),
      api.listLeads().catch(() => null),
    ])
    setCounts({
      notifications: notif?.unread ?? 0,
      leads: Array.isArray(leads) ? leads.length : 0,
    })
  }, [role])
  // refetch on mount and whenever the route changes (e.g. after reading notifications)
  useEffect(() => { refresh() }, [refresh, location.pathname])

  return (
    <CountsContext.Provider value={{ ...counts, refresh }}>
    <DrawerContext.Provider value={{ open: drawerOpen, setOpen: setDrawerOpen }}>
      <div
        style={{
          height: '100vh',
          display: 'flex',
          overflow: 'hidden',
          background: colors.bg,
          color: colors.ink,
        }}
      >
        <Sidebar config={config} className={`wa-sidebar${drawerOpen ? ' wa-open' : ''}`} />
        <div
          className={`wa-drawer-backdrop${drawerOpen ? ' wa-open' : ''}`}
          onClick={() => setDrawerOpen(false)}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>
          <Outlet />
        </div>
      </div>
    </DrawerContext.Provider>
    </CountsContext.Provider>
  )
}

/** Scrollable, padded content region for a portal page (sits under the Topbar). */
export function PortalMain({ children, maxWidth, padding = '24px 28px', style }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div className="wa-portal-main" style={{ padding, maxWidth, margin: maxWidth ? '0 auto' : undefined, ...style }}>{children}</div>
    </div>
  )
}

export default PortalLayout
