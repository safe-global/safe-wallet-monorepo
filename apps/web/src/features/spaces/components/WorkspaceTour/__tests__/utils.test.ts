import { TOUR_PLACEHOLDER_ROW_HEIGHT } from '@safe-global/views/features/spaces/components/WorkspaceTour/TourPlaceholderRow'
import { toStopLayout, toVirtualAnchor } from '../utils'

const TABS_AREA = { top: 100, left: 280, width: 900, height: 600, radius: 16 }
const EMPTY_STATE = { top: 220, left: 280, width: 900, height: 300, radius: 12 }
const SIDEBAR = { top: 0, left: 8, width: 240, height: 900, radius: 16 }
const SIDEBAR_ITEM = { top: 200, left: 16, width: 220, height: 36, radius: 8 }

const NOTHING_MEASURED = { anchor: null, emptyState: null, sidebarItem: null, sidebar: null }

describe('toStopLayout', () => {
  it('spotlights the anchor as it is when the list has items', () => {
    const layout = toStopLayout({ ...NOTHING_MEASURED, anchor: TABS_AREA })

    expect(layout).toMatchObject({ hole: TABS_AREA, placeholderRow: null, highlights: [TABS_AREA] })
  })

  it('draws a placeholder row at the top of the empty state', () => {
    const { placeholderRow } = toStopLayout({ ...NOTHING_MEASURED, anchor: TABS_AREA, emptyState: EMPTY_STATE })

    expect(placeholderRow).toEqual({ ...EMPTY_STATE, height: TOUR_PLACEHOLDER_ROW_HEIGHT })
  })

  it('ends the spotlight at the bottom of the placeholder row', () => {
    const { hole } = toStopLayout({ ...NOTHING_MEASURED, anchor: TABS_AREA, emptyState: EMPTY_STATE })

    expect(hole).toEqual({ ...TABS_AREA, height: EMPTY_STATE.top + TOUR_PLACEHOLDER_ROW_HEIGHT - TABS_AREA.top })
  })

  it('leaves the whole sidebar uncovered and outlines the sidebar item', () => {
    const layout = toStopLayout({ ...NOTHING_MEASURED, anchor: TABS_AREA, sidebarItem: SIDEBAR_ITEM, sidebar: SIDEBAR })

    expect(layout.uncoveredLeft).toBe(SIDEBAR.left + SIDEBAR.width)
    expect(layout.highlights).toEqual([TABS_AREA, SIDEBAR_ITEM])
  })

  it('points the card at the sidebar item when the stop has no page element', () => {
    const layout = toStopLayout({ ...NOTHING_MEASURED, sidebarItem: SIDEBAR_ITEM, sidebar: SIDEBAR })

    expect(layout).toMatchObject({ hole: null, popoverTarget: SIDEBAR_ITEM, highlights: [SIDEBAR_ITEM] })
  })

  it('covers the whole page when no sidebar is involved', () => {
    const { uncoveredLeft } = toStopLayout({ ...NOTHING_MEASURED, anchor: TABS_AREA })

    expect(uncoveredLeft).toBe(0)
  })
})

describe('toVirtualAnchor', () => {
  it('reports the rect as client coordinates', () => {
    const rect = toVirtualAnchor(EMPTY_STATE).getBoundingClientRect()

    expect(rect).toMatchObject({ x: 280, y: 220, right: 1180, bottom: 520 })
  })
})
