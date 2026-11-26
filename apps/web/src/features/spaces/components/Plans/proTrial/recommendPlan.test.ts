import { isSalesLed, recommendSeats } from './recommendPlan'

describe('recommendSeats', () => {
  it.each([
    [1, 5],
    [5, 5],
    [6, 10],
    [10, 10],
    [11, 20],
    [25, 20],
  ])('%i Safes → Business %i', (safes, seats) => {
    expect(recommendSeats(safes)).toBe(seats)
  })
})

describe('isSalesLed', () => {
  it('keeps plans up to the threshold self-serve', () => {
    expect(isSalesLed(10)).toBe(false)
  })

  it('sends larger plans and Enterprise to sales', () => {
    expect(isSalesLed(20)).toBe(true)
    expect(isSalesLed(null)).toBe(true)
  })

  it('follows a different threshold', () => {
    expect(isSalesLed(20, 20)).toBe(false)
  })
})
