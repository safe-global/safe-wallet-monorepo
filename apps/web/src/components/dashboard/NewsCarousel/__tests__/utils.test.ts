import { getSlidePosition } from '@/components/dashboard/NewsCarousel/utils'

describe('getSlidePosition', () => {
  const itemWidth = 100 // slide is 100px wide

  it('keeps the same slide when drag right is below the threshold', () => {
    expect(getSlidePosition(0, 9, itemWidth)).toBe(0)
  })

  it('moves to the next slide when drag right exceeds the threshold', () => {
    expect(getSlidePosition(0, 40, itemWidth)).toBe(100)
  })

  it('keeps the same slide when drag left is below the threshold', () => {
    expect(getSlidePosition(100, 91, itemWidth)).toBe(100)
  })

  it('moves to the previous slide when drag left exceeds the threshold', () => {
    expect(getSlidePosition(100, 60, itemWidth)).toBe(0)
  })

  it('respects a custom ratio', () => {
    expect(getSlidePosition(0, 26, itemWidth, 0.25)).toBe(100)
  })

  it('falls back to the start value when swipe width cannot be measured', () => {
    expect(getSlidePosition(0, 40, undefined)).toBe(0)
  })
})
