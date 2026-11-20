import type { CSSProperties } from 'react'
import type { SpotlightRect } from '@safe-global/views/features/spaces/components/WorkspaceTour/types'

export type ScrimPanel = Pick<CSSProperties, 'top' | 'right' | 'bottom' | 'left' | 'width' | 'height'>

export const toScrimPanels = (hole: SpotlightRect | null, uncoveredLeft: number): ScrimPanel[] => {
  if (!hole) return [{ top: 0, right: 0, bottom: 0, left: uncoveredLeft }]

  const holeRight = hole.left + hole.width
  const holeBottom = hole.top + hole.height
  return [
    { top: 0, right: 0, left: uncoveredLeft, height: hole.top },
    { top: holeBottom, right: 0, bottom: 0, left: uncoveredLeft },
    { top: hole.top, left: uncoveredLeft, width: Math.max(hole.left - uncoveredLeft, 0), height: hole.height },
    { top: hole.top, right: 0, left: holeRight, height: hole.height },
  ]
}
