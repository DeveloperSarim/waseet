import React from 'react'
import { Link } from 'react-router-dom'
import { colors, radius } from '../../theme/tokens'
import { Icon } from '../icons/Icon'
import { useHover } from '../../hooks/useHover'

/** Breadcrumb trail: items = [{ label, to }], last item is current (bold). */
export function Breadcrumb({ items = [], style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, ...style }}>
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <React.Fragment key={i}>
            {item.to && !last ? (
              <Link to={item.to} style={{ color: colors.textSoft }}>
                {item.label}
              </Link>
            ) : (
              <span style={{ color: last ? colors.ink : colors.textSoft, fontWeight: last ? 600 : 400 }}>
                {item.label}
              </span>
            )}
            {!last && <Icon name="chevronRight" size={14} color={colors.textFaint} />}
          </React.Fragment>
        )
      })}
    </div>
  )
}

/** Centered empty-state block for lists with no results. */
export function EmptyState({ icon = 'search', title, subtitle, action, style }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '56px 20px',
        ...style,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: colors.surfaceMuted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <Icon name={icon} size={20} color={colors.textFaint} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: colors.textSoft, marginTop: 4, maxWidth: 320 }}>{subtitle}</div>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}

/** Thin horizontal divider. */
export function Divider({ style }) {
  return <div style={{ height: 1, background: colors.border, ...style }} />
}

/** Small circular icon button (e.g. the "⋮" menu on cards). */
export function IconButton({ icon, size = 32, iconSize = 16, onClick, title, style }) {
  const [hovered, hoverProps] = useHover()
  return (
    <button
      {...hoverProps}
      onClick={onClick}
      title={title}
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        border: `1px solid ${hovered ? colors.borderStrong : 'transparent'}`,
        background: hovered ? colors.surfaceAlt : 'transparent',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.textSoft,
        ...style,
      }}
    >
      <Icon name={icon} size={iconSize} color="currentColor" />
    </button>
  )
}

/** Page-section header: title + optional description + right-aligned actions. */
export function SectionHeader({ title, description, actions, style }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 16,
        ...style,
      }}
    >
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</div>
        {description && <div style={{ fontSize: 13, color: colors.textSoft, marginTop: 3 }}>{description}</div>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  )
}

export default Breadcrumb
