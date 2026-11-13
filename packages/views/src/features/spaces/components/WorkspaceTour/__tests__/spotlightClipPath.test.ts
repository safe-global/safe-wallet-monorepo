import { spotlightClipPath } from '@safe-global/views/features/spaces/components/WorkspaceTour/spotlightClipPath'

const VIEWPORT = 'M0,0 H100000 V100000 H0 Z'

describe('spotlightClipPath', () => {
  it('covers the whole viewport when there is nothing to spotlight', () => {
    expect(spotlightClipPath([])).toBe(`path(evenodd, "${VIEWPORT}")`)
  })

  it('cuts one rounded hole per rect', () => {
    const path = spotlightClipPath([
      { top: 10, left: 20, width: 100, height: 40, radius: 8 },
      { top: 200, left: 20, width: 50, height: 50, radius: 0 },
    ])

    expect(path).toContain('M28,10 H112 A8,8 0 0 1 120,18')
    expect(path).toContain('M20,200 H70')
    expect(path.match(/ Z/g)).toHaveLength(3)
  })

  it('caps the corner radius at half the shorter side', () => {
    expect(spotlightClipPath([{ top: 0, left: 0, width: 100, height: 20, radius: 50 }])).toContain(
      'M10,0 H90 A10,10 0 0 1 100,10',
    )
  })
})
