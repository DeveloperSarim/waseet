import React from 'react'
import { colors } from '../../theme/tokens'
import { Icon } from '../icons/Icon'

/**
 * 56px portal top bar: left slot (page title or breadcrumb) + right actions.
 * Pass `title` for the common case, or `left` for custom content.
 */
export function Topbar({ title, left, right, actions, notifications = 0, avatar }) {
  return (
    <div
      style={{
        height: 56,
        minHeight: 56,
        background: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        padding: '0 22px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {left || <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {right}
        {actions}
        {notifications > 0 && (
          <div style={{ position: 'relative', display: 'flex', cursor: 'pointer' }}>
            <Icon name="bell" size={20} color={colors.textSoft} />
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -5,
                background: colors.green,
                color: '#fff',
                fontSize: 9,
                fontWeight: 700,
                borderRadius: 999,
                minWidth: 15,
                height: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
              }}
            >
              {notifications}
            </span>
          </div>
        )}
        {avatar}
      </div>
    </div>
  )
}

export default Topbar
