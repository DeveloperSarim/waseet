import { createContext, useContext } from 'react'

// Live portal counts (unread notifications, open leads) used for sidebar badges
// and the topbar bell. Defaults are null so consumers outside a provider fall
// back to their own props instead of showing a hard 0.
export const CountsContext = createContext({ notifications: null, leads: null, refresh: () => {} })
export const useCounts = () => useContext(CountsContext)
