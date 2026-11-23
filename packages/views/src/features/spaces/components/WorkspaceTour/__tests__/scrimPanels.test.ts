import { toScrimPanels } from '@safe-global/views/features/spaces/components/WorkspaceTour/scrimPanels'

const HOLE = { top: 100, left: 300, width: 600, height: 80, radius: 12 }
const SIDEBAR_RIGHT = 240

describe('toScrimPanels', () => {
  it('covers everything right of the uncovered column when there is no hole', () => {
    expect(toScrimPanels(null, SIDEBAR_RIGHT)).toEqual([{ top: 0, right: 0, bottom: 0, left: SIDEBAR_RIGHT }])
  })

  it('surrounds the hole with four panels and leaves the hole itself uncovered', () => {
    const panels = toScrimPanels(HOLE, 0)

    expect(panels).toEqual([
      { top: 0, right: 0, left: 0, height: 100 },
      { top: 180, right: 0, bottom: 0, left: 0 },
      { top: 100, left: 0, width: 300, height: 80 },
      { top: 100, right: 0, left: 900, height: 80 },
    ])
  })

  it('starts every panel after the uncovered sidebar column', () => {
    const panels = toScrimPanels(HOLE, SIDEBAR_RIGHT)

    expect(panels.map(({ left }) => left)).toEqual([SIDEBAR_RIGHT, SIDEBAR_RIGHT, SIDEBAR_RIGHT, 900])
    expect(panels[2].width).toBe(HOLE.left - SIDEBAR_RIGHT)
  })
})
