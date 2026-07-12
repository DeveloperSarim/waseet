import React from 'react'
import { colors } from '../../theme/tokens'

/** Initials avatar (square or round) matching the source's user chips. */
export function Avatar({ initials, size = 32, round = true, background = colors.ink, color = colors.white, fontSize, style }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: round ? '50%' : 8,
        background,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: fontSize || Math.round(size * 0.36),
        fontWeight: 700,
        letterSpacing: '-0.01em',
        ...style,
      }}
    >
      {initials}
    </div>
  )
}

export default Avatar
