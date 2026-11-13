import { TOUR_PLACEHOLDER_ROW_HEIGHT } from '@safe-global/views/features/spaces/components/WorkspaceTour/TourPlaceholderRow'
import { toStopHighlight, toVirtualAnchor } from '../utils'

const TABS_AREA = { top: 100, left: 280, width: 900, height: 600, radius: 16 }
const EMPTY_STATE = { top: 220, left: 280, width: 900, height: 300, radius: 12 }

describe('toStopHighlight', () => {
  it('spotlights the anchor as it is when the list has items', () => {
    const highlight = toStopHighlight(TABS_AREA, null)

    expect(highlight).toEqual({ hole: TABS_AREA, placeholderRow: null })
  })

  it('draws a placeholder row at the top of the empty state', () => {
    const { placeholderRow } = toStopHighlight(TABS_AREA, EMPTY_STATE)

    expect(placeholderRow).toEqual({ ...EMPTY_STATE, height: TOUR_PLACEHOLDER_ROW_HEIGHT })
  })

  it('ends the spotlight at the bottom of the placeholder row', () => {
    const { hole } = toStopHighlight(TABS_AREA, EMPTY_STATE)

    expect(hole).toEqual({ ...TABS_AREA, height: EMPTY_STATE.top + TOUR_PLACEHOLDER_ROW_HEIGHT - TABS_AREA.top })
  })

  it('shrinks the spotlight to the row when the empty state is the anchor itself', () => {
    const { hole } = toStopHighlight(EMPTY_STATE, EMPTY_STATE)

    expect(hole.height).toBe(TOUR_PLACEHOLDER_ROW_HEIGHT)
  })
})

describe('toVirtualAnchor', () => {
  it('reports the rect as client coordinates', () => {
    const rect = toVirtualAnchor(EMPTY_STATE).getBoundingClientRect()

    expect(rect).toMatchObject({ x: 280, y: 220, right: 1180, bottom: 520 })
  })
})
