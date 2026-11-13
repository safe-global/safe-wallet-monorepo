import { FAKE_CLOCK_START } from '../../jest.clock.cjs'

describe('the global fake clock', () => {
  it('starts a test at the configured instant', () => {
    expect(Date.now() - FAKE_CLOCK_START).toBeLessThan(1_000)

    jest.advanceTimersByTime(250_000)
  })

  it('starts the next test at the configured instant after the previous test moved the clock', () => {
    expect(Date.now() - FAKE_CLOCK_START).toBeLessThan(1_000)
  })
})
