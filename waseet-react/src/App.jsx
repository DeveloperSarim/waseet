import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import { PublicLayout } from './components/layout/PublicLayout'
import { PortalLayout } from './components/layout/PortalLayout'
import { PortalPlaceholder, PublicPlaceholder } from './pages/Placeholder'

// Public site
import { RequireAuth } from './components/RequireAuth'
import Landing from './pages/public/Landing'
import Marketplace from './pages/public/Marketplace'
import MarketplaceListing from './pages/public/MarketplaceListing'
import MarketplaceMap from './pages/public/MarketplaceMap'
import ProjectDetail from './pages/public/ProjectDetail'
import Legal from './pages/public/Legal'
import { ErrorPage, MaintenancePage } from './pages/public/StatusPages'

// Auth
import Login from './pages/auth/Login'
import RealtorRegistration from './pages/auth/RealtorRegistration'
import DeveloperRegistration from './pages/auth/DeveloperRegistration'
import PasswordFlows from './pages/auth/PasswordFlows'
import ForcedPasswordChange from './pages/auth/ForcedPasswordChange'
import ChangePassword from './pages/auth/ChangePassword'

// Realtor portal
import RealtorDashboard from './pages/realtor/RealtorDashboard'
import MyLeads from './pages/realtor/MyLeads'
import LeadDetail from './pages/realtor/LeadDetail'
import RealtorCommissions from './pages/realtor/RealtorCommissions'
import SavedProjects from './pages/realtor/SavedProjects'
import Notifications from './pages/realtor/Notifications'
import RealtorProfile from './pages/realtor/RealtorProfile'
import BadgeProgress from './pages/realtor/BadgeProgress'
import RecentlyViewed from './pages/realtor/RecentlyViewed'
import RealtorSettings from './pages/realtor/RealtorSettings'
import RealtorBrowse from './pages/realtor/RealtorBrowse'
import BankDetails from './pages/realtor/BankDetails'
import NotificationPreferences from './pages/realtor/NotificationPreferences'
import CommissionDetail from './pages/realtor/CommissionDetail'

// Developer portal
import DeveloperDashboard from './pages/developer/DeveloperDashboard'
import RealtorNetwork from './pages/developer/RealtorNetwork'
import MyProjects from './pages/developer/MyProjects'
import ProjectAnalytics from './pages/developer/ProjectAnalytics'
import DeveloperLeads from './pages/developer/DeveloperLeads'
import DeveloperLeadDetail from './pages/developer/DeveloperLeadDetail'
import DeveloperProfile from './pages/developer/DeveloperProfile'
import AddProject from './pages/developer/AddProject'
import DeveloperNotifications from './pages/developer/DeveloperNotifications'
import DeveloperSettings from './pages/developer/DeveloperSettings'
import EditProject from './pages/developer/EditProject'
import CommissionHistory from './pages/developer/CommissionHistory'

// Admin console
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminDevelopers from './pages/admin/AdminDevelopers'
import AdminRealtors from './pages/admin/AdminRealtors'
import AdminProjects from './pages/admin/AdminProjects'
import AdminDisputes from './pages/admin/AdminDisputes'
import AdminDisputeDetail from './pages/admin/AdminDisputeDetail'
import AdminSettings from './pages/admin/AdminSettings'
import AdminAnnouncements from './pages/admin/AdminAnnouncements'
import AdminLeads from './pages/admin/AdminLeads'
import AdminCommissions from './pages/admin/AdminCommissions'
import AdminCommissionDetail from './pages/admin/AdminCommissionDetail'
import AdminDataExport from './pages/admin/AdminDataExport'
import AdminEmailTemplates from './pages/admin/AdminEmailTemplates'
import AdminReview from './pages/admin/AdminReview'
import AdminRealtorReview from './pages/admin/AdminRealtorReview'
import AdminProjectReview from './pages/admin/AdminProjectReview'
import AdminProjectEdit from './pages/admin/AdminProjectEdit'

export default function App() {
  return (
    <Routes>
      {/* ---------- Public site (shared nav + footer) ---------- */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        {/* private marketplace — keeps the public nav/footer but is login-gated */}
        <Route path="/marketplace" element={<RequireAuth><Marketplace /></RequireAuth>} />
        <Route path="/legal/:doc" element={<Legal />} />
      </Route>

      {/* ---------- Standalone status pages ---------- */}
      <Route path="/error" element={<ErrorPage />} />
      <Route path="/maintenance" element={<MaintenancePage />} />

      {/* ---------- Dedicated map search (login-gated, own layout) ---------- */}
      <Route path="/marketplace/map" element={<RequireAuth><MarketplaceMap /></RequireAuth>} />

      {/* ---------- Private project detail (logged-in / trusted users only) ---------- */}
      <Route path="/marketplace/:id" element={<RequireAuth><ProjectDetail /></RequireAuth>} />
      <Route path="/realtor/projects/:id" element={<RequireAuth><ProjectDetail /></RequireAuth>} />

      {/* ---------- Standalone project pages (own navbar) ---------- */}
      <Route path="/project/:id" element={<ProjectDetail />} />
      {/* private marketplace listing (login-gated, own navbar) */}
      <Route path="/browse" element={<RequireAuth><MarketplaceListing /></RequireAuth>} />

      {/* ---------- Auth (standalone) ---------- */}
      <Route path="/login" element={<Login />} />
      <Route path="/register/realtor" element={<RealtorRegistration />} />
      <Route path="/register/developer" element={<DeveloperRegistration />} />
      <Route path="/password" element={<PasswordFlows flow="forgot" />} />
      <Route path="/forgot-password" element={<PasswordFlows flow="forgot" />} />
      <Route path="/reset-password" element={<PasswordFlows flow="reset" />} />
      <Route path="/change-password" element={<PasswordFlows flow="forced" />} />
      <Route path="/forced-password-change" element={<ForcedPasswordChange />} />
      <Route path="/account/change-password" element={<ChangePassword />} />

      {/* ---------- Realtor portal ---------- */}
      <Route element={<PortalLayout role="realtor" />}>
        <Route path="/realtor" element={<RealtorDashboard />} />
        <Route path="/realtor/browse" element={<RealtorBrowse />} />
        <Route path="/realtor/leads" element={<MyLeads />} />
        <Route path="/realtor/leads/:id" element={<LeadDetail />} />
        <Route path="/realtor/commissions" element={<RealtorCommissions />} />
        <Route path="/realtor/commissions/:id" element={<CommissionDetail />} />
        <Route path="/realtor/bank" element={<BankDetails />} />
        <Route path="/realtor/notification-preferences" element={<NotificationPreferences />} />
        <Route path="/realtor/saved" element={<SavedProjects />} />
        <Route path="/realtor/badge" element={<BadgeProgress />} />
        <Route path="/realtor/recently-viewed" element={<RecentlyViewed />} />
        <Route path="/realtor/profile" element={<RealtorProfile />} />
        <Route path="/realtor/notifications" element={<Notifications />} />
        <Route path="/realtor/settings" element={<RealtorSettings />} />
      </Route>

      {/* ---------- Developer portal ---------- */}
      <Route element={<PortalLayout role="developer" />}>
        <Route path="/developer" element={<DeveloperDashboard />} />
        <Route path="/developer/projects" element={<MyProjects />} />
        <Route path="/developer/projects/new" element={<AddProject />} />
        <Route path="/developer/projects/:id/edit" element={<EditProject />} />
        <Route path="/developer/commission-history" element={<CommissionHistory />} />
        <Route path="/developer/analytics" element={<ProjectAnalytics />} />
        <Route path="/developer/leads" element={<DeveloperLeads />} />
        <Route path="/developer/leads/:id" element={<DeveloperLeadDetail />} />
        <Route path="/developer/commissions" element={<CommissionHistory />} />
        <Route path="/developer/network" element={<RealtorNetwork />} />
        <Route path="/developer/profile" element={<DeveloperProfile />} />
        <Route path="/developer/notifications" element={<DeveloperNotifications />} />
        <Route path="/developer/settings" element={<DeveloperSettings />} />
      </Route>

      {/* ---------- Admin console ---------- */}
      <Route element={<PortalLayout role="admin" />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/developers" element={<AdminDevelopers />} />
        <Route path="/admin/developers/:id" element={<AdminReview role="developer" />} />
        <Route path="/admin/realtors" element={<AdminRealtors />} />
        <Route path="/admin/realtors/:id" element={<AdminRealtorReview />} />
        <Route path="/admin/projects" element={<AdminProjects />} />
        <Route path="/admin/projects/:id" element={<AdminProjectReview />} />
        <Route path="/admin/projects/:id/edit" element={<AdminProjectEdit />} />
        <Route path="/admin/leads" element={<AdminLeads />} />
        <Route path="/admin/commissions" element={<AdminCommissions />} />
        <Route path="/admin/commissions/:id" element={<AdminCommissionDetail />} />
        <Route path="/admin/disputes" element={<AdminDisputes />} />
        <Route path="/admin/disputes/:id" element={<AdminDisputeDetail />} />
        <Route path="/admin/announcements" element={<AdminAnnouncements />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/email-templates" element={<AdminEmailTemplates />} />
        <Route path="/admin/data-export" element={<AdminDataExport />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
