import { renderHook } from '@testing-library/react'
import { trackEvent } from '@/services/analytics'
import { useTrackOnce } from '../useTrackOnce'

jest.mock('@/services/analytics', () => ({ trackEvent: jest.fn() }))

const EVENT = { category: 'test', action: 'Viewed' }

describe('useTrackOnce', () => {
  beforeEach(() => jest.clearAllMocks())

  it('tracks once with the params of the render where ready became true', () => {
    const { rerender } = renderHook(({ ready, count }) => useTrackOnce(EVENT, { count }, ready), {
      initialProps: { ready: false, count: 0 },
    })
    expect(trackEvent).not.toHaveBeenCalled()

    rerender({ ready: true, count: 1 })
    rerender({ ready: false, count: 2 })
    rerender({ ready: true, count: 3 })

    expect(trackEvent).toHaveBeenCalledTimes(1)
    expect(trackEvent).toHaveBeenCalledWith(EVENT, { count: 1 })
  })
})
