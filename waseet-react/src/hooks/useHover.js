import { useState, useCallback } from 'react'

/**
 * Mirrors the source's `style-hover` attribute: merge an extra style object
 * while the pointer is over an element.
 *
 *   const [hovered, hoverProps] = useHover()
 *   <div {...hoverProps} style={{ ...base, ...(hovered ? hoverStyle : null) }} />
 */
export function useHover() {
  const [hovered, setHovered] = useState(false)
  const onMouseEnter = useCallback(() => setHovered(true), [])
  const onMouseLeave = useCallback(() => setHovered(false), [])
  return [hovered, { onMouseEnter, onMouseLeave }]
}

export default useHover
