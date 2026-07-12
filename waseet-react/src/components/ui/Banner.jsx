import React from 'react'
import { colors, radius } from '../../theme/tokens'
import { Icon } from '../icons/Icon'

/**
 * Left-accented notice banner (info / warning / error / success),
 * mirroring the "application under review" / locked banners in the source.
 */
const tones = {
  warning: {
    bg: colors.amberTint,
    border: colors.amberTintBorder,
    accent: colors.amber,
    title: colors.amberText,
    text: colors.amberText,
    icon: 'clock',
  },
  error: {
    bg: colors.redTint,
    border: colors.redTintBorder,
    accent: colors.red,
    title: colors.red,
    text: '#B91C1C',
    icon: 'alertCircle',
  },
  success: {
    bg: colors.greenTint,
    border: colors.greenTintBorder,
    accent: colors.green,
    title: colors.greenDarker,
    text: colors.greenDark,
    icon: 'checkCircle',
  },
  info: {
    bg: colors.blueTint,
    border: colors.blueTintBorder,
    accent: colors.blue,
    title: '#1E40AF',
    text: '#1D4ED8',
    icon: 'info',
  },
}

export function Banner({ tone = 'info', title, children, icon, action, style }) {
  const t = tones[tone] || tones.info
  return (
    <div
      style={{
        background: t.bg,
        border: `1px solid ${t.border}`,
        borderLeft: `3px solid ${t.accent}`,
        borderRadius: radius.lg,
        padding: '12px 14px',
        ...style,
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ flexShrink: 0, marginTop: 1 }}>
          <Icon name={icon || t.icon} size={16} color={t.accent} strokeWidth={1.8} />
        </span>
        <div style={{ flex: 1 }}>
          {title && <div style={{ fontSize: 13, fontWeight: 600, color: t.title }}>{title}</div>}
          {children && <div style={{ fontSize: 12, color: t.text, marginTop: title ? 2 : 0 }}>{children}</div>}
          {action && <div style={{ marginTop: 8 }}>{action}</div>}
        </div>
      </div>
    </div>
  )
}

export default Banner
