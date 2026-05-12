import { renderHook } from '@/tests/test-utils'
import { useIsSpaceRoute } from '../useIsSpaceRoute'

const mockPathname = jest.fn()

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}))

describe('useIsSpaceRoute', () => {
  beforeEach(() => {
    mockPathname.mockReset()
  })

  it('returns true on the spaces index route', () => {
    mockPathname.mockReturnValue('/spaces')
    const { result } = renderHook(() => useIsSpaceRoute())
    expect(result.current).toBe(true)
  })

  it('returns true on spaces subpages in the list', () => {
    for (const path of ['/spaces/settings', '/spaces/members', '/spaces/safe-accounts', '/spaces/address-book']) {
      mockPathname.mockReturnValue(path)
      const { result } = renderHook(() => useIsSpaceRoute())
      expect(result.current).toBe(true)
    }
  })

  it('returns false on non-spaces routes', () => {
    mockPathname.mockReturnValue('/home')
    const { result } = renderHook(() => useIsSpaceRoute())
    expect(result.current).toBe(false)
  })

  it('returns false on /welcome/spaces (sign-in landing page)', () => {
    mockPathname.mockReturnValue('/welcome/spaces')
    const { result } = renderHook(() => useIsSpaceRoute())
    expect(result.current).toBe(false)
  })

  it('returns false on /spaces/create-space (not part of sidebar variant)', () => {
    mockPathname.mockReturnValue('/spaces/create-space')
    const { result } = renderHook(() => useIsSpaceRoute())
    expect(result.current).toBe(false)
  })

  it('returns false when pathname is null', () => {
    mockPathname.mockReturnValue(null)
    const { result } = renderHook(() => useIsSpaceRoute())
    expect(result.current).toBe(false)
  })
})
