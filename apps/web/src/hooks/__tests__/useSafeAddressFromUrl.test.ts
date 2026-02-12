import { useRouter } from 'next/compat/router'
import { renderHook } from '@/tests/test-utils'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'

// Mock useRouter from next/compat/router (returns null when router is not mounted)
jest.mock('next/compat/router', () => ({
  useRouter: jest.fn(() => ({
    pathname: '/safe/home',
    query: {
      safe: 'rin:0x0000000000000000000000000000000000000001',
    },
  })),
}))

// Tests for the useSafeAddress hook
describe('useSafeAddress hook', () => {
  const originalLocation = window.location

  beforeEach(() => {
    // Reset location.search so the fallback doesn't pick up stale values
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, search: '' },
      writable: true,
    })
  })

  afterAll(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    })
  })

  it('should return the safe address', () => {
    const { result } = renderHook(() => useSafeAddressFromUrl())
    expect(result.current).toBe('0x0000000000000000000000000000000000000001')
  })

  it('should not return the safe address when it is not in the query', () => {
    ;(useRouter as any).mockImplementation(() => ({
      pathname: '/',
      query: {
        safe: undefined,
      },
    }))

    const { result } = renderHook(() => useSafeAddressFromUrl())
    expect(result.current).toBe('')
  })

  it('should cheksum the safe address', () => {
    ;(useRouter as any).mockImplementation(() => ({
      pathname: '/safe/home',
      query: {
        safe: 'eth:0x220866b1a2219f40e72f5c628b65d54268ca3a9d',
      },
    }))

    const { result } = renderHook(() => useSafeAddressFromUrl())
    expect(result.current).toBe('0x220866B1A2219f40e72f5c628B65D54268cA3A9D')
  })

  it('should return empty address for safe routes w/o query', () => {
    ;(useRouter as any).mockImplementation(() => ({
      pathname: '/safe/home',
      query: {},
    }))

    const { result } = renderHook(() => useSafeAddressFromUrl())
    expect(result.current).toBe('')
  })

  it('should fall back to location.search when router.query is empty', () => {
    ;(useRouter as any).mockImplementation(() => ({
      pathname: '/safe/home',
      query: {},
    }))

    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, search: '?safe=eth:0x220866b1a2219f40e72f5c628b65d54268ca3a9d' },
      writable: true,
    })

    const { result } = renderHook(() => useSafeAddressFromUrl())
    expect(result.current).toBe('0x220866B1A2219f40e72f5c628B65D54268cA3A9D')
  })

  it('should return empty address when router is null (not mounted)', () => {
    ;(useRouter as any).mockImplementation(() => null)

    const { result } = renderHook(() => useSafeAddressFromUrl())
    expect(result.current).toBe('')
  })
})
