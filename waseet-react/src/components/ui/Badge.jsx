import React from 'react'
import { colors, radius } from '../../theme/tokens'

/**
 * Small status/label pills. `tone` picks the colour family; `variant`
 * switches between the soft tinted pill and the tiny uppercase role tag.
 */
const tones = {
  green: { color: colors.greenDark, background: colors.greenTint, border: colors.greenTintBorder },
  amber: { color: colors.amberText, background: colors.amberTint, border: colors.amberTintBorder },
  red: { color: colors.red, background: colors.redTint, border: colors.redTintBorder },
  blue: { color: colors.blue, background: colors.blueTint, border: colors.blueTintBorder },
  gray: { color: colors.textFaint, background: colors.surfaceMuted, border: colors.border },
  dark: { color: colors.white, background: colors.ink, border: colors.ink },
  purple: { color: colors.purple, background: colors.purpleTint, border: '#DDD6FE' },
}

export function Badge({ children, tone = 'gray', variant = 'soft', dot = false, style }) {
  const t = tones[tone] || tones.gray
  if (variant === 'tag') {
    return (
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: t.color,
          background: t.background,
          border: `1px solid ${t.border}`,
          borderRadius: radius.xs,
          padding: '2px 6px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          ...style,
        }}
      >
        {children}
      </span>
    )
  }
  if (variant === 'count') {
    return (
      <span
        style={{
          fontSize: 10,
          background: t.background,
          border: `1px solid ${t.border}`,
          color: t.color,
          borderRadius: radius.pill,
          padding: '1px 7px',
          ...style,
        }}
      >
        {children}
      </span>
    )
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 600,
        color: t.color,
        background: t.background,
        border: `1px solid ${t.border}`,
        borderRadius: radius.sm,
        padding: '3px 8px',
        ...style,
      }}
    >
      {dot && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, display: 'inline-block' }} />
      )}
      {children}
    </span>
  )
}

export default Badge
