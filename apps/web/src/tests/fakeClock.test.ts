import { FAKE_CLOCK_START } from '../../jest.clock.cjs'

describe('the global fake clock', () => {
  it('starts a test at the configured instant', () => {
    expect(Date.now() - FAKE_CLOCK_START).toBeLessThan(1_000)

    jest.advanceTimersByTime(250_000)
    setTimeout(() => {}, 1_000)
  })

  it('starts the next test at the configured instant without the timers of the previous test', () => {
    expect(Date.now() - FAKE_CLOCK_START).toBeLessThan(1_000)
    expect(jest.getTimerCount()).toBe(0)
  })
})
