import { FAKE_CLOCK_START } from '../../jest.clock.cjs'

const isFakeClock = () => Object.prototype.hasOwnProperty.call(setTimeout, 'clock')

describe('the global fake clock', () => {
  it('starts a test at the configured instant', () => {
    expect(Date.now() - FAKE_CLOCK_START).toBeLessThan(1_000)

    jest.advanceTimersByTime(250_000)
  })

  it('starts the next test at the configured instant after the previous test moved the clock', () => {
    expect(Date.now() - FAKE_CLOCK_START).toBeLessThan(1_000)

    // eslint-disable-next-line no-restricted-properties -- checks that the next test gets the fake clock back
    jest.useRealTimers()
  })

  it('runs the next test on the fake clock after the previous test switched to real timers', () => {
    expect(isFakeClock()).toBe(true)
    expect(Date.now() - FAKE_CLOCK_START).toBeLessThan(1_000)
  })

  it('keeps a cookie until its expiry on the fake clock', () => {
    const inAnHour = new Date(Date.now() + 3_600_000).toUTCString()
    const anHourAgo = new Date(Date.now() - 3_600_000).toUTCString()

    document.cookie = `kept=1; expires=${inAnHour}; path=/`
    document.cookie = `expired=1; expires=${anHourAgo}; path=/`

    expect(document.cookie).toContain('kept=1')
    expect(document.cookie).not.toContain('expired=1')

    document.cookie = `kept=; expires=${anHourAgo}; path=/`
    expect(document.cookie).not.toContain('kept=1')
  })

  it('runs a queued microtask before a promise that settles after it', async () => {
    const order: string[] = []

    queueMicrotask(() => order.push('microtask'))
    await Promise.resolve()
    order.push('promise')

    expect(order).toEqual(['microtask', 'promise'])
  })
})
