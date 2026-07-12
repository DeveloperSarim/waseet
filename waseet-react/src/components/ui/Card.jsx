import React from 'react'
import { colors, radius, shadow } from '../../theme/tokens'
import { useHover } from '../../hooks/useHover'

/**
 * White surface with border + subtle shadow. Set `hoverable` for the
 * lift-on-hover treatment used by marketplace/project cards.
 */
export function Card({ children, hoverable = false, padding = 20, style, ...rest }) {
  const [hovered, hoverProps] = useHover()
  return (
    <div
      {...(hoverable ? hoverProps : null)}
      {...rest}
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.xl,
        boxShadow: hoverable && hovered ? shadow.lg : shadow.sm,
        padding,
        transition: 'box-shadow 160ms ease, transform 160ms ease, border-color 160ms ease',
        ...(hoverable && hovered ? { transform: 'translateY(-2px)', borderColor: colors.borderStrong } : null),
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export default Card
