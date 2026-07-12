import React from 'react'
import { colors } from '../../theme/tokens'

/**
 * The number-over-label stat used in page headers
 * (e.g. "4 / Total projects", "SAR 81k / Commission paid").
 */
export function Stat({ value, label, valueColor = colors.ink, align = 'left', size = 22, style }) {
  return (
    <div style={{ textAlign: align, ...style }}>
      <div style={{ fontSize: size, fontWeight: 700, letterSpacing: '-0.02em', color: valueColor, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{label}</div>
    </div>
  )
}

/** Horizontal row of stats separated by generous gaps (page header style). */
export function StatRow({ children, gap = 28, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap, ...style }}>{children}</div>
  )
}

export default Stat
