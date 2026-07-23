// Tiny fetch wrapper for the Waseet API.
// - attaches the in-memory access token
// - sends the httpOnly refresh cookie (credentials: 'include')
// - on a 401, transparently tries /auth/refresh once, then retries

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:19000/api/v1'

let accessToken = null
export const setAccessToken = (t) => { accessToken = t }
export const getAccessToken = () => accessToken

async function refreshAccessToken() {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
    if (!res.ok) return false
    const data = await res.json()
    accessToken = data.accessToken
    return true
  } catch {
    return false
  }
}

async function request(path, { method = 'GET', body, auth = false, _retry = false } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && auth && !_retry) {
    if (await refreshAccessToken()) return request(path, { method, body, auth, _retry: true })
  }

  let data = null
  try { data = await res.json() } catch { /* no body */ }

  if (!res.ok) {
    const err = new Error(data?.error?.message || `Request failed (${res.status})`)
    err.status = res.status
    err.code = data?.error?.code
    err.details = data?.error?.details
    throw err
  }
  return data
}

export const authApi = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  registerRealtor: (payload) => request('/auth/register/realtor', { method: 'POST', body: payload }),
  registerDeveloper: (payload) => request('/auth/register/developer', { method: 'POST', body: payload }),
  me: () => request('/auth/me', { auth: true }),
  updateMe: (payload) => request('/auth/me', { method: 'PATCH', auth: true, body: payload }).then((d) => d.user),
  changePassword: (currentPassword, newPassword) => request('/auth/change-password', { method: 'POST', auth: true, body: { currentPassword, newPassword } }),
  refresh: () => request('/auth/refresh', { method: 'POST' }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, password) => request('/auth/reset-password', { method: 'POST', body: { token, password } }),
  // upload/replace own profile photo (logo); returns the refreshed user
  uploadAvatar: async (file) => {
    const fd = new FormData()
    fd.append('file', file)
    const headers = {}
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`
    const res = await fetch(`${API_URL}/auth/me/avatar`, { method: 'POST', headers, credentials: 'include', body: fd })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.error?.message || 'Upload failed')
    return data.user
  },
  // public logo upload during registration → { key, url }
  uploadLogo: async (file) => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`${API_URL}/auth/upload-logo`, { method: 'POST', credentials: 'include', body: fd })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.error?.message || 'Upload failed')
    return data.result
  },
}

// Admin-only endpoints (require an ACTIVE admin access token)
export const adminApi = {
  listUsers: ({ status, role } = {}) => {
    const qs = new URLSearchParams()
    if (status) qs.set('status', status)
    if (role) qs.set('role', role)
    const q = qs.toString()
    return request(`/admin/users${q ? `?${q}` : ''}`, { auth: true }).then((d) => d.users)
  },
  getUser: (id) => request(`/admin/users/${id}`, { auth: true }).then((d) => d.user),
  approveUser: (id) => request(`/admin/users/${id}/approve`, { method: 'POST', auth: true }).then((d) => d.result),
  rejectUser: (id, reason) => request(`/admin/users/${id}/reject`, { method: 'POST', auth: true, body: { reason } }).then((d) => d.result),
  updateUser: (id, patch) => request(`/admin/users/${id}`, { method: 'PATCH', auth: true, body: patch }).then((d) => d.user),
  suspendUser: (id, reason) => request(`/admin/users/${id}/suspend`, { method: 'POST', auth: true, body: { reason } }).then((d) => d.result),
  reactivateUser: (id) => request(`/admin/users/${id}/reactivate`, { method: 'POST', auth: true }).then((d) => d.result),
  banUser: (id, payload) => request(`/admin/users/${id}/ban`, { method: 'POST', auth: true, body: payload }).then((d) => d.result),
  sendPasswordReset: (id) => request(`/admin/users/${id}/password-reset`, { method: 'POST', auth: true }).then((d) => d.result),
  setDocumentStatus: (docId, status, reason) => request(`/admin/documents/${docId}/status`, { method: 'POST', auth: true, body: { status, reason } }).then((d) => d.user),
  uploadUserAvatar: async (id, file) => {
    const fd = new FormData()
    fd.append('file', file)
    const headers = {}
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`
    const res = await fetch(`${API_URL}/admin/users/${id}/avatar`, { method: 'POST', headers, credentials: 'include', body: fd })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.error?.message || 'Upload failed')
    return data.result
  },
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE', auth: true }).then((d) => d.result),
  emailUser: (id, payload) => request(`/admin/users/${id}/email`, { method: 'POST', auth: true, body: payload }).then((d) => d.result),
  // domain screens
  dashboard: () => request('/admin/dashboard', { auth: true }),
  listProjects: (params = {}) => request(`/admin/projects${qstr(params)}`, { auth: true }),
  getProject: (id) => request(`/admin/projects/${id}`, { auth: true }).then((d) => d.project),
  updateProject: (id, payload) => request(`/admin/projects/${id}`, { method: 'PATCH', auth: true, body: payload }).then((d) => d.project),
  uploadProjectImage: async (file) => {
    const fd = new FormData()
    fd.append('file', file)
    const headers = {}
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`
    const res = await fetch(`${API_URL}/admin/projects/image`, { method: 'POST', headers, credentials: 'include', body: fd })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.error?.message || 'Upload failed')
    return data
  },
  setProjectStatus: (id, status) => request(`/admin/projects/${id}/status`, { method: 'POST', auth: true, body: { status } }).then((d) => d.result),
  setProjectFeatured: (id, featured) => request(`/admin/projects/${id}/feature`, { method: 'POST', auth: true, body: { featured } }).then((d) => d.result),
  listLeads: (params = {}) => request(`/admin/leads${qstr(params)}`, { auth: true }).then((d) => d.leads),
  getLead: (id) => request(`/admin/leads/${id}`, { auth: true }).then((d) => d.lead),
  listCommissions: (params = {}) => request(`/admin/commissions${qstr(params)}`, { auth: true }),
  getCommission: (id) => request(`/admin/commissions/${id}`, { auth: true }).then((d) => d.commission),
  disburseCommission: (id) => request(`/admin/commissions/${id}/disburse`, { method: 'POST', auth: true }).then((d) => d.commission),
  listWithdrawals: (params = {}) => request(`/admin/withdrawals${qstr(params)}`, { auth: true }),
  markWithdrawalPaid: (id) => request(`/admin/withdrawals/${id}/mark-paid`, { method: 'POST', auth: true }).then((d) => d.result),
  rejectWithdrawal: (id, reason) => request(`/admin/withdrawals/${id}/reject`, { method: 'POST', auth: true, body: { reason } }).then((d) => d.result),
  listDisputes: (params = {}) => request(`/admin/disputes${qstr(params)}`, { auth: true }),
  getDispute: (id) => request(`/admin/disputes/${id}`, { auth: true }).then((d) => d.dispute),
  resolveDispute: (id, payload) => request(`/admin/disputes/${id}/resolve`, { method: 'POST', auth: true, body: payload }).then((d) => d.result),
  listAnnouncements: () => request('/admin/announcements', { auth: true }).then((d) => d.announcements),
  createAnnouncement: (payload) => request('/admin/announcements', { method: 'POST', auth: true, body: payload }).then((d) => d.result),
  clearAnnouncements: () => request('/admin/announcements', { method: 'DELETE', auth: true }),
  getEmailTemplates: () => request('/admin/email-templates', { auth: true }).then((d) => d.templates),
  updateEmailTemplate: (key, patch) => request(`/admin/email-templates/${key}`, { method: 'PATCH', auth: true, body: patch }).then((d) => d.templates),
}

const qstr = (params) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString()
  return qs ? `?${qs}` : ''
}

// Developer portal data (projects, leads, commissions, network, analytics, dashboard, notifications)
export const developerApi = {
  dashboard: () => request('/developer/dashboard', { auth: true }),
  listProjects: () => request('/developer/projects', { auth: true }).then((d) => d.projects),
  getProject: (id) => request(`/developer/projects/${id}`, { auth: true }).then((d) => d.project),
  createProject: (payload) => request('/developer/projects', { method: 'POST', auth: true, body: payload }).then((d) => d.project),
  updateProject: (id, payload) => request(`/developer/projects/${id}`, { method: 'PATCH', auth: true, body: payload }).then((d) => d.project),
  deleteProject: (id) => request(`/developer/projects/${id}`, { method: 'DELETE', auth: true }),
  uploadProjectImage: async (file) => {
    const fd = new FormData()
    fd.append('file', file)
    const headers = {}
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`
    const res = await fetch(`${API_URL}/developer/projects/image`, { method: 'POST', headers, credentials: 'include', body: fd })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.error?.message || 'Upload failed')
    return data
  },
  listLeads: (params = {}) => request(`/developer/leads${qstr(params)}`, { auth: true }).then((d) => d.leads),
  getLead: (id) => request(`/developer/leads/${id}`, { auth: true }).then((d) => d.lead),
  updateLeadStatus: (id, status) => request(`/developer/leads/${id}`, { method: 'PATCH', auth: true, body: { status } }).then((d) => d.lead),
  closeDeal: (id, gross, closedAt) => request(`/developer/leads/${id}/close`, { method: 'POST', auth: true, body: { gross, closedAt } }),
  createDispute: (payload) => request('/developer/disputes', { method: 'POST', auth: true, body: payload }).then((d) => d.dispute),
  listDisputes: () => request('/developer/disputes', { auth: true }).then((d) => d.disputes),
  listCommissions: (params = {}) => request(`/developer/commissions${qstr(params)}`, { auth: true }),
  payCommission: (id) => request(`/developer/commissions/${id}/pay`, { method: 'POST', auth: true }),
  markCommissionFailed: (id, reason) => request(`/developer/commissions/${id}/mark-failed`, { method: 'POST', auth: true, body: { reason } }),
  network: () => request('/developer/network', { auth: true }).then((d) => d.realtors),
  analytics: () => request('/developer/analytics', { auth: true }),
  listNotifications: () => request('/developer/notifications', { auth: true }),
  markNotificationRead: (id) => request(`/developer/notifications/${id}/read`, { method: 'POST', auth: true }),
  markAllNotificationsRead: () => request('/developer/notifications/read-all', { method: 'POST', auth: true }),
}

// Admin platform settings (commission, email, security, platform info, maintenance, backups)
export const settingsApi = {
  get: () => request('/admin/settings', { auth: true }),
  getStats: () => request('/admin/settings/stats', { auth: true }).then((d) => d.stats),
  updateSection: (section, patch) => request(`/admin/settings/${section}`, { method: 'PATCH', auth: true, body: patch }).then((d) => d.value),
  listDevelopers: () => request('/admin/settings/developers', { auth: true }).then((d) => d.developers),
  addOverride: (payload) => request('/admin/settings/overrides', { method: 'POST', auth: true, body: payload }).then((d) => d.value),
  removeOverride: (name) => request('/admin/settings/overrides', { method: 'DELETE', auth: true, body: { name } }).then((d) => d.value),
  resetOverrides: () => request('/admin/settings/reset-overrides', { method: 'POST', auth: true }).then((d) => d.value),
  testEmail: (to) => request('/admin/settings/test-email', { method: 'POST', auth: true, body: { to } }),
  listBackups: () => request('/admin/settings/backups', { auth: true }).then((d) => d.backups),
  createBackup: (note) => request('/admin/settings/backups', { method: 'POST', auth: true, body: { note } }).then((d) => d.backup),
  restoreBackup: (id) => request(`/admin/settings/backups/${id}/restore`, { method: 'POST', auth: true }),
  deleteBackup: (id) => request(`/admin/settings/backups/${id}`, { method: 'DELETE', auth: true }),
  backupDownloadUrl: (id) => `${API_URL}/admin/settings/backups/${id}/download`,
  exportUrl: () => `${API_URL}/admin/settings/export`,
  // landing-page CMS: save the whole `landing` section, upload favicon/app-icon/banner/section images
  saveLanding: (patch) => request('/admin/settings/landing', { method: 'PATCH', auth: true, body: patch }).then((d) => d.value),
  uploadLandingAsset: async (file) => {
    const fd = new FormData()
    fd.append('file', file)
    const headers = {}
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`
    const res = await fetch(`${API_URL}/admin/landing/asset`, { method: 'POST', headers, credentials: 'include', body: fd })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.error?.message || 'Upload failed')
    return data // { key, url, ... }
  },
}

// Public landing-page content + SEO (no auth) — powers the homepage.
export const landingApi = {
  get: () => request('/landing').then((d) => d.landing),
}

// Public platform status (no auth) — used to detect maintenance mode
export const statusApi = {
  get: () => request('/status'),
}

// Public Saudi geography reference (cities + districts) for the search dropdowns.
export const geoApi = {
  cities: () => request('/geo/cities').then((d) => d.cities || []),
  districts: (cityId) => request(`/geo/cities/${cityId}/districts`).then((d) => d.districts || []),
}

// Realtor portal data (projects/marketplace, saved, leads, commissions, notifications, dashboard)
export const realtorApi = {
  listProjects: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/realtor/projects${qs ? `?${qs}` : ''}`, { auth: true }).then((d) => d.projects)
  },
  getProject: (id) => request(`/realtor/projects/${id}`, { auth: true }).then((d) => d.project),
  saveProject: (id) => request(`/realtor/projects/${id}/save`, { method: 'POST', auth: true }),
  unsaveProject: (id) => request(`/realtor/projects/${id}/save`, { method: 'DELETE', auth: true }),
  listSaved: () => request('/realtor/saved', { auth: true }).then((d) => d.projects),
  marketplaceStats: () => request('/realtor/marketplace-stats', { auth: true }).then((d) => d.stats),
  listLeads: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/realtor/leads${qs ? `?${qs}` : ''}`, { auth: true }).then((d) => d.leads)
  },
  getLead: (id) => request(`/realtor/leads/${id}`, { auth: true }).then((d) => d.lead),
  listCommissions: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/realtor/commissions${qs ? `?${qs}` : ''}`, { auth: true })
  },
  getCommission: (id) => request(`/realtor/commissions/${id}`, { auth: true }).then((d) => d.commission),
  createLead: (payload) => request('/realtor/leads', { method: 'POST', auth: true, body: payload }).then((d) => d.lead),
  createDispute: (payload) => request('/realtor/disputes', { method: 'POST', auth: true, body: payload }).then((d) => d.dispute),
  listDisputes: () => request('/realtor/disputes', { auth: true }).then((d) => d.disputes),
  getWallet: () => request('/realtor/wallet', { auth: true }),
  requestWithdrawal: (payload = {}) => request('/realtor/withdrawals', { method: 'POST', auth: true, body: payload }).then((d) => d.withdrawal),
  listNotifications: () => request('/realtor/notifications', { auth: true }),
  markNotificationRead: (id) => request(`/realtor/notifications/${id}/read`, { method: 'POST', auth: true }),
  markAllNotificationsRead: () => request('/realtor/notifications/read-all', { method: 'POST', auth: true }),
  dashboard: () => request('/realtor/dashboard', { auth: true }),
}

// Multipart document upload (uses the in-memory access token set after register/login)
export const documentsApi = {
  list: () => request('/documents', { auth: true }).then((d) => d.documents),
  upload: async (type, file) => {
    const fd = new FormData()
    fd.append('type', type)
    fd.append('file', file)
    const headers = {}
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`
    const res = await fetch(`${API_URL}/documents`, { method: 'POST', headers, credentials: 'include', body: fd })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      const err = new Error(data?.error?.message || 'Upload failed')
      err.status = res.status
      throw err
    }
    return data.document
  },
}

export { request }
