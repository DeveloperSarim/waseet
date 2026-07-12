# Waseet — React Frontend

A faithful React conversion of the Waseet (وسيط) B2B real-estate platform design
(originally authored as Claude design-compiler `.dc.html` files).

## Stack

- **Vite** + **React 18** (JSX)
- **React Router v6** for client-side routing
- **Style objects + a shared theme** (`src/theme/tokens.js`) — a 1:1 port of the
  source's inline styles, so the visual result matches pixel-for-pixel.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # preview the production build
```

## Structure

```
src/
  theme/           tokens.js (colors, radius, shadow, type) + globalStyles.css
  hooks/           useHover (mirrors the source's style-hover)
  components/
    icons/         Icon (feather-style registry) + Logo
    ui/            Button, Input, Badge, Card, Stat, Tabs, Avatar, Banner,
                   Toggle, Select, Breadcrumb, EmptyState, IconButton…
    layout/        PublicLayout (nav + footer), PortalLayout (role-aware sidebar
                   + Topbar). Sidebar supports the light (realtor/developer) and
                   dark (admin) themes from the source.
    ProjectCard.jsx
  config/nav.js    Portal navigation for each role, with exact source SVG paths.
  data/mock.js     Shared mock data (projects, leads, commissions…).
  pages/
    public/        Landing, Marketplace, MarketplaceListing, ProjectDetail
    auth/          Login, RealtorRegistration, DeveloperRegistration
    realtor/       RealtorDashboard, …
    developer/ · admin/
  App.jsx          Routes for every screen.
```

## Conversion status

Built as agreed in stages. The app **runs end-to-end and every screen is
navigable today** (sidebars, routing, and the design system are complete).

**Fully converted**
- Public **Landing** page (all 15 sections)
- **Marketplace** (hero, search/filter card, stats, project grid, dark band)
- **Login**
- **Realtor Dashboard**
- Shared system: theme, icons, UI primitives, public shell, both portal shells.

**Scaffolded (navigable placeholder, queued for conversion)**
- Marketplace Listing, Project Detail, Realtor/Developer registration
- The remaining Realtor, Developer, and Admin portal pages.

Each placeholder renders inside its correct shell, so navigation, the sidebars,
and role theming already reflect the final design.

## Notes

- The source's "preview only" state-switcher toolbars were dropped; mock data and
  interactive states are preserved.
- The landing page's scroll-jacked product showcase is reproduced as an
  equivalent click-through stepper.
