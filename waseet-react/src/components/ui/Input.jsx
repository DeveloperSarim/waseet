import React, { useState } from 'react'
import { colors, radius } from '../../theme/tokens'
import { Icon } from '../icons/Icon'

/**
 * Text input matching the source's 34px bordered field, with optional
 * leading icon and an error state (red border + tint).
 */
export function Input({
  icon,
  error = false,
  disabled = false,
  rightSlot,
  style,
  wrapperStyle,
  ...rest
}) {
  const [focused, setFocused] = useState(false)
  const padLeft = icon ? 34 : 12
  const padRight = rightSlot ? 34 : 12
  return (
    <div style={{ position: 'relative', ...wrapperStyle }}>
      {icon && (
        <Icon
          name={icon}
          size={14}
          color={colors.textFaint}
          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
        />
      )}
      <input
        {...rest}
        disabled={disabled}
        onFocus={(e) => {
          setFocused(true)
          rest.onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          rest.onBlur?.(e)
        }}
        style={{
          width: '100%',
          height: 34,
          borderRadius: radius.md,
          padding: `0 ${padRight}px 0 ${padLeft}px`,
          fontSize: 13,
          fontFamily: 'inherit',
          color: colors.ink,
          background: error ? colors.redTint : colors.surface,
          border: `1px solid ${error ? colors.red : focused ? colors.borderStrong : colors.border}`,
          opacity: disabled ? 0.6 : 1,
          transition: 'border-color 120ms ease',
          ...style,
        }}
      />
      {rightSlot && (
        <span
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
          }}
        >
          {rightSlot}
        </span>
      )}
    </div>
  )
}

/** Field wrapper with a label above the control. */
export function Field({ label, hint, children, style }) {
  return (
    <div style={{ marginBottom: 12, ...style }}>
      {label && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 500, color: colors.textMuted }}>{label}</span>
          {hint}
        </div>
      )}
      {children}
    </div>
  )
}

export default Input
