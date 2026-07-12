import React from 'react'
import { colors } from '../../theme/tokens'

/** iOS-style switch used in settings / notification preference pages. */
export function Toggle({ checked, onChange, disabled = false, style }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      style={{
        width: 38,
        height: 22,
        borderRadius: 999,
        border: 'none',
        padding: 2,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? colors.green : colors.borderStrong,
        opacity: disabled ? 0.5 : 1,
        transition: 'background 160ms ease',
        display: 'inline-flex',
        alignItems: 'center',
        ...style,
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          transform: checked ? 'translateX(16px)' : 'translateX(0)',
          transition: 'transform 160ms ease',
        }}
      />
    </button>
  )
}

export default Toggle
