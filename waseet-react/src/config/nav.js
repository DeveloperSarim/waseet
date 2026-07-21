// Portal navigation, transcribed from the source dashboards.
// Each item carries the exact source SVG path so the sidebar icons match 1:1.

const D = {
  dashboard: 'M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 9h8V3h-8z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4-4',
  clipboard:
    'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2',
  coin:
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 7v10M9.5 9.5c0-1 1.1-1.5 2.5-1.5s2.5.5 2.5 1.5-1.1 1.5-2.5 1.5-2.5.5-2.5 1.5 1.1 1.5 2.5 1.5 2.5-.5 2.5-1.5',
  bookmark: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-1a6 6 0 0 1 12 0v1',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  // Realtor & Developer sidebar gear (exact source path)
  gear:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.6 1.6 0 0 0-2.7 1.1 2 2 0 1 1-4 0 1.6 1.6 0 0 0-2.7-1.1 2 2 0 1 1-2.8-2.8 1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1 2 2 0 1 1 0-4 1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8 2 2 0 1 1 2.8-2.8 1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5 2 2 0 1 1 4 0 1.6 1.6 0 0 0 2.7 1.1 2 2 0 1 1 2.8 2.8 1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1 2 2 0 1 1 0 4 1.6 1.6 0 0 0-1.5 1z',
  // Admin sidebar gear (exact source path — slightly different)
  adminGear:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.6 1.6 0 0 0-2.7 1.1 2 2 0 1 1-4 0 1.6 1.6 0 0 0-2.7-1.1 2 2 0 1 1-2.8-2.8 1.6 1.6 0 0 0-1.2-2.8 2 2 0 1 1 0-4 1.6 1.6 0 0 0 1.2-2.8 2 2 0 1 1 2.8-2.8 1.6 1.6 0 0 0 2.7-1.1 2 2 0 1 1 4 0 1.6 1.6 0 0 0 2.7 1.1 2 2 0 1 1 2.8 2.8 1.6 1.6 0 0 0 1.2 2.8 2 2 0 1 1 0 4 1.6 1.6 0 0 0-1.5 1z',
  building: 'M3 21h18M6 21V7l6-4 6 4v14M9 9h2M13 9h2M9 13h2M13 13h2',
  users:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  usersSolid: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  dispute: 'M14 9V5a3 3 0 0 0-6 0v4M5 9h14l1 12H4zM12 13v4',
  megaphone: 'M3 11l18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6',
  mail: 'M3 5h18v14H3zM3 7l9 6 9-6',
  export: 'M12 3v12M7 10l5 5 5-5M5 21h14',
  store: 'M3 9l1.5-5h15L21 9M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9zM3 9h18M9 13h6',
  bank: 'M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3',
}

export const navConfig = {
  realtor: {
    base: '/realtor',
    theme: 'light',
    badge: { label: 'Realtor', color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
    user: { name: 'Ahmed Al-Rashid', sub: 'Gold Realtor 🥇', subColor: '#15803D', initials: 'AR' },
    groups: [
      {
        label: 'Main',
        items: [
          { label: 'Dashboard', to: '/realtor', d: D.dashboard },
          { label: 'My Leads', to: '/realtor/leads', d: D.clipboard, badgeKey: 'leads' },
          { label: 'Commissions', to: '/realtor/commissions', d: D.coin },
          { label: 'Disputes', to: '/realtor/disputes', d: D.dispute },
          { label: 'Saved Projects', to: '/realtor/saved', d: D.bookmark },
          { label: 'Marketplace', to: '/marketplace', d: D.store },
        ],
      },
      {
        label: 'Account',
        items: [
          { label: 'My Profile', to: '/realtor/profile', d: D.user },
          { label: 'Notifications', to: '/realtor/notifications', d: D.bell, badgeKey: 'notifications' },
          { label: 'Settings', to: '/realtor/settings', d: D.gear },
        ],
      },
    ],
  },

  developer: {
    base: '/developer',
    theme: 'light',
    badge: { label: 'Developer', color: '#5B5BD6', bg: '#F5F3FF', border: '#DDD6FE' },
    user: { name: 'Al Faisal Development', sub: 'Developer', subColor: '#9CA3AF', initials: 'AF' },
    groups: [
      {
        label: 'Main',
        items: [
          { label: 'Dashboard', to: '/developer', d: D.dashboard },
          { label: 'My Projects', to: '/developer/projects', d: D.building },
          { label: 'All Leads', to: '/developer/leads', d: D.clipboard, badgeKey: 'leads' },
          { label: 'Commissions', to: '/developer/commissions', d: D.coin },
          { label: 'Disputes', to: '/developer/disputes', d: D.dispute },
          { label: 'Realtor Network', to: '/developer/network', d: D.users },
          { label: 'Marketplace', to: '/marketplace', d: D.store },
        ],
      },
      {
        label: 'Account',
        items: [
          { label: 'Company Profile', to: '/developer/profile', d: D.user },
          { label: 'Notifications', to: '/developer/notifications', d: D.bell, badgeKey: 'notifications' },
          { label: 'Settings', to: '/developer/settings', d: D.gear },
        ],
      },
    ],
  },

  admin: {
    base: '/admin',
    theme: 'dark',
    badge: { label: 'Admin', color: '#fff', bg: '#DC2626', border: '#DC2626', marginLeftAuto: true },
    user: { name: 'Super Admin', sub: 'admin@waseet.io', subColor: 'rgba(255,255,255,0.4)', initials: 'SA' },
    groups: [
      {
        label: 'Management',
        items: [
          { label: 'Dashboard', to: '/admin', d: D.dashboard },
          { label: 'Developers', to: '/admin/developers', d: D.building, badge: '3' },
          { label: 'Realtors', to: '/admin/realtors', d: D.usersSolid, badge: '8' },
          { label: 'Projects', to: '/admin/projects', d: D.home, badge: '2' },
          { label: 'Marketplace', to: '/marketplace', d: D.store },
        ],
      },
      {
        label: 'Operations',
        items: [
          { label: 'All Leads', to: '/admin/leads', d: D.clipboard },
          { label: 'Commissions', to: '/admin/commissions', d: D.coin },
          { label: 'Withdrawals', to: '/admin/withdrawals', d: D.bank },
          { label: 'Disputes', to: '/admin/disputes', d: D.dispute, badge: '2', badgeRed: true },
        ],
      },
      {
        label: 'Platform',
        items: [
          { label: 'Announcements', to: '/admin/announcements', d: D.megaphone },
          { label: 'Settings', to: '/admin/settings', d: D.adminGear },
          { label: 'Email Templates', to: '/admin/email-templates', d: D.mail },
          { label: 'Data Export', to: '/admin/data-export', d: D.export },
        ],
      },
    ],
  },
}

export default navConfig
