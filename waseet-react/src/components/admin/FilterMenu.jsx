import React, { useState } from 'react'
import { colors } from '../../theme/tokens'

const chevron = (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textFaint} strokeWidth={2}><path d="M6 9l6 6 6-6" /></svg>
)

// Compact dropdown filter styled like the admin filter pills. Opens a menu on
// click, closes on outside click / selection. `options` is [{ value, label }];
// the option with value '' is the "all / clear" choice. When a non-empty value
// is selected the pill goes active (dark text + tinted background).
export function FilterMenu({ label, value, options, onChange, align = 'left' }) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)
  const active = value !== '' && value != null

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <span
        onClick={() => setOpen((o) => !o)}
        style={{ height: 34, padding: '0 12px', border: `1px solid ${active ? colors.borderStrong : colors.border}`, borderRadius: 7, fontSize: 12, color: active ? colors.ink : colors.textMuted, fontWeight: active ? 600 : 400, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: active ? colors.surfaceMuted : '#fff', whiteSpace: 'nowrap' }}
      >
        {active && selected ? selected.label : label} {chevron}
      </span>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{ position: 'absolute', top: 40, [align]: 0, minWidth: 180, maxHeight: 300, overflowY: 'auto', background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 41, padding: 4 }}>
            {options.map((o) => {
              const on = o.value === value
              return (
                <div
                  key={o.value || 'all'}
                  onClick={() => { onChange(o.value); setOpen(false) }}
                  style={{ padding: '7px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, color: on ? colors.ink : colors.textMuted, fontWeight: on ? 600 : 400, background: on ? colors.surfaceMuted : 'transparent', whiteSpace: 'nowrap' }}
                >
                  {o.label}
                  {on && <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2.5}><path d="M20 6L9 17l-5-5" /></svg>}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export default FilterMenu
