import { TOUR_PLACEHOLDER_ROW_HEIGHT } from '@safe-global/views/features/spaces/components/WorkspaceTour/TourPlaceholderRow'
import type { SpotlightRect } from '@safe-global/views/features/spaces/components/WorkspaceTour/types'

type MeasuredStop = {
  anchor: SpotlightRect | null
  emptyState: SpotlightRect | null
  sidebarItem: SpotlightRect | null
  sidebar: SpotlightRect | null
}

type StopLayout = {
  hole: SpotlightRect | null
  placeholderRow: SpotlightRect | null
  uncoveredLeft: number
  highlights: SpotlightRect[]
  popoverTarget: SpotlightRect | null
}

const withPlaceholderRow = (anchor: SpotlightRect, emptyState: SpotlightRect | null) => {
  if (!emptyState) return { hole: anchor, placeholderRow: null }

  const placeholderRow = { ...emptyState, height: TOUR_PLACEHOLDER_ROW_HEIGHT }
  const placeholderBottom = placeholderRow.top + placeholderRow.height
  return { hole: { ...anchor, height: placeholderBottom - anchor.top }, placeholderRow }
}

export const toStopLayout = ({ anchor, emptyState, sidebarItem, sidebar }: MeasuredStop): StopLayout => {
  const { hole, placeholderRow } = anchor
    ? withPlaceholderRow(anchor, emptyState)
    : { hole: null, placeholderRow: null }

  return {
    hole,
    placeholderRow,
    uncoveredLeft: sidebar ? sidebar.left + sidebar.width : 0,
    highlights: [hole, sidebarItem].filter((rect): rect is SpotlightRect => rect !== null),
    popoverTarget: hole ?? sidebarItem,
  }
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
