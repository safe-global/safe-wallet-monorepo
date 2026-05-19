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

  it('should not redirect to / on a safe route when ?safe is present without ?spaceId', () => {
    const replace = jest.fn(() => Promise.resolve(true))

    renderHook(() => useAdjustUrl(), {
      routerProps: {
        asPath: '/home?safe=eth:0x0000000000000000000000000000000000000000',
        pathname: '/home',
        query: { safe: 'eth:0x0000000000000000000000000000000000000000' },
        replace,
      },
    })

    expect(replace).not.toHaveBeenCalled()
  })

  it('should not redirect to / on a safe route when both ?safe and ?spaceId are present', () => {
    const replace = jest.fn(() => Promise.resolve(true))

    renderHook(() => useAdjustUrl(), {
      routerProps: {
        asPath: '/home?safe=eth:0x0000000000000000000000000000000000000000&spaceId=42',
        pathname: '/home',
        query: { safe: 'eth:0x0000000000000000000000000000000000000000', spaceId: '42' },
        replace,
      },
    })

    expect(replace).not.toHaveBeenCalled()
  })

  it('should defer to useSpaceIdSync when ?spaceId is the only param on a non-safe route', () => {
    const replace = jest.fn(() => Promise.resolve(true))

    renderHook(() => useAdjustUrl(), {
      routerProps: {
        asPath: '/welcome?spaceId=42',
        pathname: '/welcome',
        query: { spaceId: '42' },
        replace,
      },
    })

    expect(replace).not.toHaveBeenCalled()
  })

  it('should not redirect when the route is not in SAFE_ROUTES even without ?safe', () => {
    const replace = jest.fn(() => Promise.resolve(true))

    renderHook(() => useAdjustUrl(), {
      routerProps: {
        asPath: '/welcome/spaces',
        pathname: '/welcome/spaces',
        query: {},
        replace,
      },
    })

    expect(replace).not.toHaveBeenCalled()
  })

  it('should not redirect before the router is ready', () => {
    const replace = jest.fn(() => Promise.resolve(true))

    renderHook(() => useAdjustUrl(), {
      routerProps: {
        asPath: '/home',
        pathname: '/home',
        query: {},
        replace,
        isReady: false,
      },
    })

    expect(replace).not.toHaveBeenCalled()
  })

  it('should defer to useSpaceIdSync on every safe route when ?spaceId is set, even with no ?safe', () => {
    const replace = jest.fn(() => Promise.resolve(true))

    renderHook(() => useAdjustUrl(), {
      routerProps: {
        asPath: '/transactions/history?spaceId=7',
        pathname: '/transactions/history',
        query: { spaceId: '7' },
        replace,
      },
    })

    expect(replace).not.toHaveBeenCalled()
  })
})
