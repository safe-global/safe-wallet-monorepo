const loadPollingInterval = (value: string | undefined): number => {
  const previous = process.env.NEXT_PUBLIC_POLLING_INTERVAL
  if (value === undefined) delete process.env.NEXT_PUBLIC_POLLING_INTERVAL
  else process.env.NEXT_PUBLIC_POLLING_INTERVAL = value
  try {
    let interval = 0
    jest.isolateModules(() => {
      interval = require('./constants').POLLING_INTERVAL
    })
    return interval
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_POLLING_INTERVAL
    else process.env.NEXT_PUBLIC_POLLING_INTERVAL = previous
  }
}

describe('POLLING_INTERVAL', () => {
  it('polls every 15 seconds when NEXT_PUBLIC_POLLING_INTERVAL is not set', () => {
    expect(loadPollingInterval(undefined)).toBe(15_000)
  })

  it('takes the interval in milliseconds from NEXT_PUBLIC_POLLING_INTERVAL', () => {
    expect(loadPollingInterval('2000')).toBe(2_000)
  })

  it.each(['', '0', 'fast'])('keeps 15 seconds for the unusable value %p', (value) => {
    expect(loadPollingInterval(value)).toBe(15_000)
  })
})
