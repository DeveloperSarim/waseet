import React from 'react'
import { colors } from '../../theme/tokens'
import { Icon } from '../../components/icons/Icon'
import { Topbar } from '../../components/layout/Topbar'
import { Avatar } from '../../components/ui'

export const statusTone = {
  Approved: { bg: colors.greenTint, color: colors.greenDark, bd: colors.greenTintBorder },
  Active: { bg: colors.greenTint, color: colors.greenDark, bd: colors.greenTintBorder },
  Live: { bg: colors.greenTint, color: colors.greenDark, bd: colors.greenTintBorder },
  Verified: { bg: colors.greenTint, color: colors.greenDark, bd: colors.greenTintBorder },
  Pending: { bg: colors.amberTint, color: colors.amberText, bd: colors.amberTintBorder },
  'Under Review': { bg: colors.amberTint, color: colors.amberText, bd: colors.amberTintBorder },
  Rejected: { bg: colors.redTint, color: colors.red, bd: colors.redTintBorder },
  Paused: { bg: colors.surfaceMuted, color: colors.textSoft, bd: colors.border },
  Open: { bg: colors.redTint, color: colors.red, bd: colors.redTintBorder },
  Resolved: { bg: colors.greenTint, color: colors.greenDark, bd: colors.greenTintBorder },
}

export function StatusPill({ status }) {
  const t = statusTone[status] || statusTone.Pending
  return <span style={{ background: t.bg, color: t.color, border: `1px solid ${t.bd}`, borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{status}</span>
}

export function AdminTopbar({ title, total, unit }) {
  return (
    <Topbar
      left={
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</span>
          <span style={{ fontSize: 13, color: colors.textFaint }}>{total} total</span>
        </div>
      }
      notifications={5}
      avatar={<Avatar initials="SA" size={30} />}
      actions={
        <button className="wa-hide-sm" style={{ height: 34, padding: '0 14px', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="download" size={14} color={colors.textMuted} strokeWidth={1.8} />Export CSV
        </button>
      }
    />
  )
}

export function AdminTabs({ tabs, active, onChange }) {
  return (
    <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '0 22px', display: 'flex' }}>
      {tabs.map(([label, count]) => {
        const on = active === label
        return (
          <div key={label} onClick={() => onChange(label)} style={{ padding: '11px 16px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', borderBottom: `2px solid ${on ? colors.ink : 'transparent'}`, color: on ? colors.ink : colors.textSoft, fontWeight: on ? 600 : 400, whiteSpace: 'nowrap' }}>
            {label}
            <span style={{ borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 600, marginLeft: 5, background: on ? colors.ink : colors.surfaceMuted, color: on ? '#fff' : colors.textSoft }}>{count}</span>
          </div>
        )
      })}
    </div>
  )
}

export function AdminSearchBar({ placeholder, filters = [] }) {
  return (
    <div style={{ background: '#fff', borderBottom: `1px solid ${colors.border}`, padding: '10px 22px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 200, maxWidth: 300, position: 'relative' }}>
        <Icon name="search" size={14} color={colors.textFaint} strokeWidth={1.8} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
        <input placeholder={placeholder} style={{ width: '100%', height: 34, border: `1px solid ${colors.border}`, borderRadius: 7, padding: '0 10px 0 32px', fontSize: 12, fontFamily: 'inherit' }} />
      </div>
      {filters.map((f) => (
        <span key={f} style={{ height: 34, padding: '0 12px', border: `1px solid ${colors.border}`, borderRadius: 7, fontSize: 12, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: '#fff' }}>
          {f} <Icon name="chevronDown" size={12} color={colors.textFaint} strokeWidth={2} />
        </span>
      ))}
    </div>
  )
}

// Page controls only appear when there's more than one page. Callers that don't
// pass `pages` (default 1) get just the count label — no fake "1 2 3 Next".
export function Pagination({ label, pages = 1, page = 1, onPage }) {
  return (
    <div style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: colors.textSoft }}>{label}</span>
      {pages > 1 && (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span onClick={() => onPage && onPage(Math.max(1, page - 1))} style={{ height: 30, padding: '0 10px', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 12, color: page === 1 ? colors.textFaint : colors.textMuted, display: 'flex', alignItems: 'center', cursor: page === 1 ? 'default' : 'pointer', background: '#fff' }}>← Prev</span>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <span key={n} onClick={() => onPage && onPage(n)} style={{ height: 30, minWidth: 30, borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: n === page ? colors.ink : '#fff', color: n === page ? '#fff' : colors.textMuted, border: n === page ? 'none' : `1px solid ${colors.border}` }}>{n}</span>
          ))}
          <span onClick={() => onPage && onPage(Math.min(pages, page + 1))} style={{ height: 30, padding: '0 10px', border: `1px solid ${colors.border}`, borderRadius: 6, fontSize: 12, color: page === pages ? colors.textFaint : colors.textMuted, display: 'flex', alignItems: 'center', cursor: page === pages ? 'default' : 'pointer', background: '#fff' }}>Next →</span>
        </div>
      )}
    </div>
  )
}

export function CheckCell({ on, onClick }) {
  return (
    <span onClick={onClick} style={{ width: 16, height: 16, minWidth: 16, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: on ? colors.green : '#fff', border: `1.5px solid ${on ? colors.green : colors.borderStrong}` }}>
      {on && <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}><path d="M20 6L9 17l-5-5" /></svg>}
    </span>
  )
}
