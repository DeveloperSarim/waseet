import React from 'react'
import { colors, radius } from '../../theme/tokens'
import { Icon } from '../icons/Icon'

/**
 * Styled native <select> that reads like the source's filter buttons
 * ("Type ⌄", "City ⌄", "Newest first ⌄"). Keeps real keyboard/selection
 * behaviour while matching the visual treatment.
 */
export function Select({ value, onChange, options = [], placeholder, style, height = 38 }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          height,
          borderRadius: radius.lg,
          border: `1px solid ${colors.border}`,
          background: colors.surface,
          color: value ? colors.textMuted : colors.textFaint,
          fontFamily: 'inherit',
          fontSize: 13,
          padding: '0 32px 0 12px',
          cursor: 'pointer',
          ...style,
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const val = typeof o === 'string' ? o : o.value
          const label = typeof o === 'string' ? o : o.label
          return (
            <option key={val} value={val}>
              {label}
            </option>
          )
        })}
      </select>
      <Icon
        name="chevronDown"
        size={14}
        color={colors.textFaint}
        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
      />
    </div>
  )
}

export default Select
