import React from 'react'
import { colors } from '../../theme/tokens'

/**
 * Waseet wordmark: map-pin glyph + "waseet" + the Arabic "وسيط".
 * Matches the lockup used in the sidebar header and public nav.
 */
export function Logo({ size = 14, color = colors.ink, showArabic = true, arabicColor = colors.textFaint }) {
  const iconSize = Math.round(size * 1.15)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s6-5.5 6-11a6 6 0 1 0-12 0c0 5.5 6 11 6 11z" />
        <circle cx="12" cy="11" r="2.4" />
      </svg>
      <span style={{ fontSize: size, fontWeight: 700, letterSpacing: '-0.02em', color }}>waseet</span>
      {showArabic && (
        <span style={{ fontSize: size * 0.78, color: arabicColor, marginLeft: 1 }}>وسيط</span>
      )}
    </span>
  )
}

export default Logo
