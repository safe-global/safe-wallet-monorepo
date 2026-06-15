import { scheduleWhileVisible } from '../visibility'

const setVisibility = (state: 'visible' | 'hidden') => {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('scheduleWhileVisible', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    setVisibility('visible')
  })

  afterEach(() => {
    jest.useRealTimers()
    setVisibility('visible')
  })

  it('runs the callback after the delay while visible', () => {
    const onTimeout = jest.fn()
    scheduleWhileVisible(1_000, onTimeout)

    jest.advanceTimersByTime(999)
    expect(onTimeout).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1)
    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  it('does not run while the tab is hidden, then runs once it is visible again', () => {
    const onTimeout = jest.fn()
    scheduleWhileVisible(1_000, onTimeout)

    setVisibility('hidden')
    jest.advanceTimersByTime(10_000)
    expect(onTimeout).not.toHaveBeenCalled()

    setVisibility('visible')
    jest.advanceTimersByTime(1_000)
    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  it('restarts the countdown from scratch each time the tab becomes visible', () => {
    const onTimeout = jest.fn()
    scheduleWhileVisible(1_000, onTimeout)

    // Almost there, then hide before it fires.
    jest.advanceTimersByTime(900)
    setVisibility('hidden')
    jest.advanceTimersByTime(10_000)
    expect(onTimeout).not.toHaveBeenCalled()

    // Returning resets the full delay — 900ms of prior progress is discarded.
    setVisibility('visible')
    jest.advanceTimersByTime(999)
    expect(onTimeout).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  it('cleanup cancels the timer and stops listening', () => {
    const onTimeout = jest.fn()
    const cleanup = scheduleWhileVisible(1_000, onTimeout)

    cleanup()
    jest.advanceTimersByTime(10_000)
    // A visibility change after cleanup must not re-arm.
    setVisibility('hidden')
    setVisibility('visible')
    jest.advanceTimersByTime(10_000)

    expect(onTimeout).not.toHaveBeenCalled()
  })
})
