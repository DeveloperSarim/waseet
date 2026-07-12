import React from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, radius } from '../theme/tokens'
import { useHover } from '../hooks/useHover'
import { Icon } from './icons/Icon'
import { statusTones } from '../data/mock'

const hatch = 'repeating-linear-gradient(45deg, #E9EBEE 0, #E9EBEE 1px, transparent 1px, transparent 8px)'

const tonePill = {
  green: { color: colors.greenDark, background: colors.greenTint, border: colors.greenTintBorder },
  amber: { color: colors.amberText, background: colors.amberTint, border: colors.amberTintBorder },
  gray: { color: colors.textFaint, background: colors.surfaceMuted, border: colors.border },
  red: { color: colors.red, background: colors.redTint, border: colors.redTintBorder },
}

/**
 * Marketplace-style project card: hatched render area with badge/save/commission,
 * then name, location, developer (verified), price, and unit-type + status pills.
 */
export function ProjectCard({ project, to }) {
  const [hovered, hoverProps] = useHover()
  const navigate = useNavigate()
  const p = project
  const featured = p.featured
  const badge = featured ? 'FEATURED' : 'NEW'
  const st = tonePill[statusTones[p.status]] || tonePill.gray

  return (
    <div
      {...hoverProps}
      onClick={() => navigate(to || `/project/${p.id}`)}
      style={{
        background: '#fff',
        border: `1px solid ${hovered ? colors.borderStrong : colors.border}`,
        borderRadius: radius.xl,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'all 160ms ease',
      }}
    >
      <div style={{ height: 168, background: colors.surfaceMuted, backgroundImage: hatch, position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: featured ? colors.greenTint : '#FEF9EC',
            border: `1px solid ${featured ? colors.greenTintBorder : '#F3E2B8'}`,
            borderRadius: 999,
            padding: '2px 9px',
            fontSize: 10,
            fontWeight: 600,
            color: featured ? colors.greenDark : '#92763A',
            letterSpacing: '0.03em',
          }}
        >
          {badge}
        </span>
        <div style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 7, background: 'rgba(255,255,255,0.92)', border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="bookmark" size={16} color={colors.textSoft} strokeWidth={1.8} />
        </div>
        <span style={{ position: 'absolute', bottom: 10, right: 10, background: colors.ink, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#fff' }}>
          {p.units[0]?.commission} Commission
        </span>
        <span style={{ position: 'absolute', bottom: 10, left: 10, fontFamily: 'monospace', fontSize: 9, color: '#B6BAC0' }}>project render</span>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4 }}>{p.name}</div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
          <Icon name="mapPin" size={12} color={colors.textFaint} strokeWidth={2} />
          <span style={{ fontSize: 12, color: colors.textFaint }}>{p.location}</span>
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 8 }}>
          <span style={{ width: 18, height: 18, borderRadius: '50%', background: colors.surfaceMuted }} />
          <span style={{ fontSize: 11, color: colors.textSoft }}>{p.developer}</span>
          <Icon name="checkCircle" size={12} color={colors.green} strokeWidth={2} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>From {p.priceFrom}</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ background: colors.surfaceMuted, borderRadius: 5, padding: '2px 8px', fontSize: 11, color: colors.textMuted, fontWeight: 500 }}>
            {p.units.length} unit types
          </span>
          <span style={{ background: st.background, border: `1px solid ${st.border}`, color: st.color, borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
            {p.status}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ProjectCard
