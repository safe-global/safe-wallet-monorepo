import { TOUR_PLACEHOLDER_ROW_HEIGHT } from '@safe-global/views/features/spaces/components/WorkspaceTour/TourPlaceholderRow'
import type { SpotlightRect } from '@safe-global/views/features/spaces/components/WorkspaceTour/types'

type StopHighlight = {
  hole: SpotlightRect
  placeholderRow: SpotlightRect | null
}

export const toStopHighlight = (anchor: SpotlightRect, emptyState: SpotlightRect | null): StopHighlight => {
  if (!emptyState) return { hole: anchor, placeholderRow: null }

  const placeholderRow = { ...emptyState, height: TOUR_PLACEHOLDER_ROW_HEIGHT }
  const placeholderBottom = placeholderRow.top + placeholderRow.height
  return { hole: { ...anchor, height: placeholderBottom - anchor.top }, placeholderRow }
}

export const toVirtualAnchor = ({ top, left, width, height }: SpotlightRect) => ({
  getBoundingClientRect: () => ({
    x: left,
    y: top,
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
  }),
})
