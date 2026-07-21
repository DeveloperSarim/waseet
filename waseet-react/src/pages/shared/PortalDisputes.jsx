import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../theme/tokens'
import { Topbar } from '../../components/layout/Topbar'
import { realtorApi, developerApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { joinedLabel } from '../../lib/adminFormat'

const money = (n) => (n == null ? null : `SAR ${Number(n).toLocaleString('en-US')}`)

const STATUS = {
  OPEN: { label: 'Open', bg: '#FEF9EC', color: '#92400E', border: '#F3E2B8' },
  UNDER_REVIEW: { label: 'Under review', bg: '#EEF3FF', color: '#1B4FD8', border: '#BFDBFE' },
  RESOLVED: { label: 'Resolved ✓', bg: colors.greenTint, color: colors.greenDark, border: colors.greenTintBorder },
  REJECTED: { label: 'Rejected', bg: colors.redTint, color: colors.red, border: colors.redTintBorder },
}
const tabDefs = ['All', 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED']
const TAB_LABEL = { All: 'All', OPEN: 'Open', UNDER_REVIEW: 'Under review', RESOLVED: 'Resolved', REJECTED: 'Rejected' }

export default function PortalDisputes() {
  const navigate = useNavigate()
  const { user } = useAuth() || {}
  const isDeveloper = user?.role === 'DEVELOPER'
  const api = isDeveloper ? developerApi : realtorApi
  const leadsPath = isDeveloper ? '/developer/leads' : '/realtor/leads'

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('All')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setRows(await api.listDisputes()) }
    catch (e) { setError(e.message || 'Could not load disputes') }
    finally { setLoading(false) }
  }, [api])
  useEffect(() => { load() }, [load])

  const count = (s) => rows.filter((d) => d.status === s).length
  const visible = tab === 'All' ? rows : rows.filter((d) => d.status === tab)

  return (
    <>
      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Disputes</span>
            <span className="wa-hide-sm" style={{ fontSize: 13, color: colors.textFaint }}>{rows.length} total</span>
          </div>
        }
      />

      {/* Tabs */}
      <div className="pd-tabs" style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '0 22px', display: 'flex', overflowX: 'auto' }}>
        {tabDefs.map((id) => {
          const on = tab === id
          const n = id === 'All' ? rows.length : count(id)
          return (
            <div key={id} onClick={() => setTab(id)} style={{ padding: '11px 16px', fontSize: 13, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', borderBottom: `2px solid ${on ? colors.ink : 'transparent'}`, color: on ? colors.ink : colors.textSoft, fontWeight: on ? 600 : 400 }}>
              {TAB_LABEL[id]}<span style={{ borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 600, marginLeft: 5, background: on ? colors.ink : colors.surfaceMuted, color: on ? '#fff' : colors.textSoft }}>{n}</span>
            </div>
          )
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: colors.bg, padding: '18px 22px' }}>
        {error && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: colors.textMuted }}>{error}</span>
            <span onClick={load} style={{ fontSize: 12, color: colors.red, fontWeight: 500, marginLeft: 'auto', cursor: 'pointer' }}>Retry</span>
          </div>
        )}

        {/* how-to hint */}
        <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={1.9} style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          <span style={{ fontSize: 12.5, color: colors.textSoft }}>Raise a new dispute from any of your <span onClick={() => navigate(leadsPath)} style={{ color: colors.greenDark, cursor: 'pointer', fontWeight: 500 }}>leads</span>{!isDeveloper ? ' or commissions' : ''} using the “Raise Dispute” button. Our team reviews within 48 hours.</span>
        </div>

        {loading && <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 13, color: colors.textFaint }}>Loading disputes…</div>}
        {!loading && visible.length === 0 && (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.textMuted }}>No disputes{tab !== 'All' ? ' in this state' : ' yet'}</div>
            <div style={{ fontSize: 13, color: colors.textFaint, marginTop: 4 }}>Disputes you raise will appear here with their status.</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map((d) => {
            const st = STATUS[d.status] || STATUS.OPEN
            return (
              <div key={d.id} style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: colors.textFaint, marginBottom: 3 }}>{d.ref}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{d.subject}</div>
                    <div style={{ fontSize: 12, color: colors.textSoft }}>Raised {joinedLabel(d.createdAt)}{d.amount ? ` · ${money(d.amount)}` : ''}</div>
                  </div>
                  <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{st.label}</span>
                </div>
                {d.resolution && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${colors.surfaceMuted}` }}>
                    <div style={{ fontSize: 10, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Resolution from Waseet</div>
                    <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.6 }}>{d.resolution}</div>
                  </div>
                )}
                <div style={{ marginTop: 10, display: 'flex', gap: 14 }}>
                  {d.leadId && <span onClick={() => navigate(`${leadsPath}/${d.leadId}`)} style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer' }}>View lead →</span>}
                  {d.commissionId && !isDeveloper && <span onClick={() => navigate(`/realtor/commissions/${d.commissionId}`)} style={{ fontSize: 12, color: colors.greenDark, cursor: 'pointer' }}>View commission →</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
