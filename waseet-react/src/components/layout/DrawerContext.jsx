import { createContext, useContext } from 'react'

// Portal mobile-drawer state, provided by PortalLayout and consumed by the
// Topbar (hamburger) and Sidebar (close-on-navigate).
export const DrawerContext = createContext(null)
export const useDrawer = () => useContext(DrawerContext)
