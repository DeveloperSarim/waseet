import React from 'react'
import { Outlet } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Sidebar } from './Sidebar'
import { navConfig } from '../../config/nav'
import { useMaintenanceGate } from '../../hooks/useMaintenanceGate'

/**
 * Portal shell: fixed sidebar + a flexible main column that hosts each page.
 * Used as a layout route wrapper: <Route element={<PortalLayout role="realtor" />}>.
 * The @media rule in globalStyles hides the sidebar on narrow screens.
 */
export function PortalLayout({ role }) {
  const config = navConfig[role]
  // realtor/developer portals go dark during maintenance; admin never does
  useMaintenanceGate(role !== 'admin')
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        overflow: 'hidden',
        background: colors.bg,
        color: colors.ink,
      }}
    >
      <Sidebar config={config} className="wa-sidebar" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>
        <Outlet />
      </div>
    </div>
  )
}

/** Scrollable, padded content region for a portal page (sits under the Topbar). */
export function PortalMain({ children, maxWidth, padding = '24px 28px', style }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ padding, maxWidth, margin: maxWidth ? '0 auto' : undefined, ...style }}>{children}</div>
    </div>
  )
}

export default PortalLayout
