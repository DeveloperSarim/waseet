import React from 'react'
import { colors } from '../../theme/tokens'
import { useHover } from '../../hooks/useHover'

/**
 * Underline tab bar used across list pages ("All (4) / Live (2) / ...").
 * `tabs` = [{ key, label, count }]. Controlled via `active` + `onChange`.
 */
function Tab({ tab, active, onChange }) {
  const [hovered, hoverProps] = useHover()
  return (
    <button
      {...hoverProps}
      onClick={() => onChange(tab.key)}
      style={{
        position: 'relative',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        color: active ? colors.ink : hovered ? colors.textMuted : colors.textSoft,
        padding: '0 0 12px',
        letterSpacing: '-0.01em',
      }}
    >
      {tab.label}
      {tab.count != null && (
        <span style={{ color: active ? colors.textSoft : colors.textFaint, marginLeft: 5 }}>({tab.count})</span>
      )}
      {active && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: -1,
            height: 2,
            background: colors.ink,
            borderRadius: 2,
          }}
        />
      )}
    </button>
  )
}

export function Tabs({ tabs, active, onChange, style }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        borderBottom: `1px solid ${colors.border}`,
        ...style,
      }}
    >
      {tabs.map((t) => (
        <Tab key={t.key} tab={t} active={t.key === active} onChange={onChange} />
      ))}
    </div>
  )
}

export default Tabs
