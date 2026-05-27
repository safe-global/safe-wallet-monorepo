import { renderHook } from '@testing-library/react'
import { useIsAuthGateBlocking } from '../useIsAuthGateBlocking'
import * as store from '@/store'
import * as useIsRequireLoginEnabledModule from '@/hooks/useIsRequireLoginEnabled'

jest.mock('@/hooks/useIsRequireLoginEnabled', () => ({
  useIsRequireLoginEnabled: jest.fn(),
}))

const setMocks = ({
  isRequireLoginEnabled,
  isSignedIn,
}: {
  isRequireLoginEnabled: boolean | undefined
  isSignedIn: boolean
}) => {
  ;(useIsRequireLoginEnabledModule.useIsRequireLoginEnabled as jest.Mock).mockReturnValue(isRequireLoginEnabled)
  jest.spyOn(store, 'useAppSelector').mockImplementation((selector) => {
    const fakeState = {
      auth: {
        sessionExpiresAt: isSignedIn ? Date.now() + 86400000 : null,
        lastUsedSpace: null,
        isStoreHydrated: true,
        isOidcLoginPending: false,
      },
    }
    return selector(fakeState as unknown as store.RootState)
  })
}

describe('useIsAuthGateBlocking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('blocks when the gate is on and the user is not signed in', () => {
    setMocks({ isRequireLoginEnabled: true, isSignedIn: false })
    expect(renderHook(() => useIsAuthGateBlocking()).result.current).toBe(true)
  })

  it('treats loading (undefined) as blocking so protected UI does not flash', () => {
    setMocks({ isRequireLoginEnabled: undefined, isSignedIn: false })
    expect(renderHook(() => useIsAuthGateBlocking()).result.current).toBe(true)
  })

  it('does not block when the gate resolves to off', () => {
    setMocks({ isRequireLoginEnabled: false, isSignedIn: false })
    expect(renderHook(() => useIsAuthGateBlocking()).result.current).toBe(false)
  })

  it('does not block once the user is signed in (regardless of gate state)', () => {
    setMocks({ isRequireLoginEnabled: true, isSignedIn: true })
    expect(renderHook(() => useIsAuthGateBlocking()).result.current).toBe(false)
    setMocks({ isRequireLoginEnabled: undefined, isSignedIn: true })
    expect(renderHook(() => useIsAuthGateBlocking()).result.current).toBe(false)
    setMocks({ isRequireLoginEnabled: false, isSignedIn: true })
    expect(renderHook(() => useIsAuthGateBlocking()).result.current).toBe(false)
  })
})
