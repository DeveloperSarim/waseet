import React from 'react'
import { colors, radius } from '../../theme/tokens'
import { useHover } from '../../hooks/useHover'
import { Icon } from '../icons/Icon'

/**
 * Button variants distilled from the source pages:
 *  - primary   : solid green CTA
 *  - dark      : solid near-black
 *  - secondary : white with border (default hover -> #F9FAFB)
 *  - ghost     : transparent, subtle hover
 *  - danger    : red text/border
 */
const base = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  border: 'none',
  borderRadius: radius.md,
  fontWeight: 500,
  fontFamily: 'inherit',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'background 120ms ease, border-color 120ms ease, opacity 120ms ease',
}

const sizes = {
  sm: { height: 30, fontSize: 12, padding: '0 12px' },
  md: { height: 34, fontSize: 13, padding: '0 16px' },
  lg: { height: 40, fontSize: 14, padding: '0 20px' },
}

function variantStyles(variant, hovered, disabled) {
  switch (variant) {
    case 'primary':
      return {
        background: disabled ? colors.textFaint : hovered ? colors.greenDark : colors.green,
        color: colors.white,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }
    case 'dark':
      return {
        background: disabled ? colors.textFaint : hovered ? '#1F1F1F' : colors.ink,
        color: colors.white,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }
    case 'secondary':
      return {
        background: hovered ? colors.surfaceAlt : colors.surface,
        color: colors.textMuted,
        border: `1px solid ${colors.border}`,
      }
    case 'ghost':
      return {
        background: hovered ? colors.surfaceMuted : 'transparent',
        color: colors.textMuted,
      }
    case 'danger':
      return {
        background: hovered ? colors.redTint : colors.surface,
        color: colors.red,
        border: `1px solid ${colors.redTintBorder}`,
      }
    default:
      return {}
  }
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  ...rest
}) {
  const [hovered, hoverProps] = useHover()
  const isDisabled = disabled || loading
  return (
    <button
      {...hoverProps}
      {...rest}
      disabled={isDisabled}
      style={{
        ...base,
        ...sizes[size],
        ...variantStyles(variant, hovered && !isDisabled, isDisabled),
        ...(fullWidth ? { width: '100%' } : null),
        ...(isDisabled && variant !== 'primary' && variant !== 'dark' ? { opacity: 0.55, cursor: 'not-allowed' } : null),
        ...style,
      }}
    >
      {loading && (
        <span
          style={{
            width: 14,
            height: 14,
            border: '2px solid rgba(255,255,255,0.4)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'pd-spin .7s linear infinite',
          }}
        />
      )}
      {!loading && icon && <Icon name={icon} size={size === 'lg' ? 16 : 14} color="currentColor" />}
      {children}
      {!loading && iconRight && <Icon name={iconRight} size={size === 'lg' ? 16 : 14} color="currentColor" />}
    </button>
  )
}

export default Button
