// Role-aware navigation targets so the marketplace / project pages send each
// user to THEIR portal (realtor / developer / admin) instead of always /realtor.
export const portalHome = (role) =>
  role === 'ADMIN' ? '/admin' : role === 'DEVELOPER' ? '/developer' : '/realtor'

// The top-nav links shown on the marketplace listing / detail pages, per role.
export function portalNavLinks(role) {
  if (role === 'DEVELOPER') {
    return [
      { label: 'My Projects', to: '/developer/projects' },
      { label: 'Leads', to: '/developer/leads' },
      { label: 'Commissions', to: '/developer/commissions' },
    ]
  }
  if (role === 'ADMIN') {
    return [
      { label: 'Dashboard', to: '/admin' },
      { label: 'Leads', to: '/admin/leads' },
      { label: 'Commissions', to: '/admin/commissions' },
    ]
  }
  return [
    { label: 'My Leads', to: '/realtor/leads' },
    { label: 'Commissions', to: '/realtor/commissions' },
    { label: 'Saved', to: '/realtor/saved' },
  ]
}

// Where a submitted lead should be viewed, per role.
export const leadsPath = (role) =>
  role === 'ADMIN' ? '/admin/leads' : role === 'DEVELOPER' ? '/developer/leads' : '/realtor/leads'
