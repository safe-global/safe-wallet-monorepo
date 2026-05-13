import useAdjustUrl from '@/hooks/useAdjustUrl'
import { renderHook } from '@/tests/test-utils'

// mock window history replaceState
Object.defineProperty(window, 'history', {
  writable: true,
  value: {
    replaceState: jest.fn(),
  },
})

describe('useAdjustUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not rewrite the URL if there is no ?safe= in the query', () => {
    renderHook(() => useAdjustUrl(), {
      routerProps: {
        asPath: '/welcome',
      },
    })

    expect(history.replaceState).not.toHaveBeenCalled()
  })

  it('should replace %3A for the safe param but preserve other query params', () => {
    renderHook(() => useAdjustUrl(), {
      routerProps: {
        asPath: '/hello?safe=gor%3A0x0000000000000000000000000000000000000000&test=hello%3Aworld',
      },
    })

    expect(history.replaceState).toHaveBeenCalledWith(
      undefined,
      '',
      '/hello?safe=gor:0x0000000000000000000000000000000000000000&test=hello%3Aworld',
    )
  })

  it('should not redirect to / on a safe route when ?spaceId is present (useSpaceIdSync owns the decision)', () => {
    const replace = jest.fn(() => Promise.resolve(true))

    renderHook(() => useAdjustUrl(), {
      routerProps: {
        asPath: '/home?spaceId=42',
        pathname: '/home',
        query: { spaceId: '42' },
        replace,
      },
    })

    expect(replace).not.toHaveBeenCalled()
  })

  it('should still redirect to / on a safe route when neither ?safe nor ?spaceId is present', () => {
    const replace = jest.fn(() => Promise.resolve(true))

    renderHook(() => useAdjustUrl(), {
      routerProps: {
        asPath: '/home',
        pathname: '/home',
        query: {},
        replace,
      },
    })

    expect(replace).toHaveBeenCalledWith({ pathname: '/' })
  })
})
