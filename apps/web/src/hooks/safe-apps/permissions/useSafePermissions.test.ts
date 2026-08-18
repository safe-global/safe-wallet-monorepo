import { renderHook, act } from '@/tests/test-utils'
import { useSafePermissions } from './useSafePermissions'
import { PermissionStatus } from '@/components/safe-apps/types'

const origin = 'https://app.url'
const requestId = 'abc1234567'

describe('useSafePermissions', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persists a denial when a request is explicitly denied', () => {
    const { result } = renderHook(() => useSafePermissions())

    act(() => {
      result.current.setPermissionsRequest({ origin, requestId, request: [{ requestAddressBook: {} }] })
    })
    act(() => {
      result.current.confirmPermissionRequest(PermissionStatus.DENIED)
    })

    // This is why a dismissal must not call confirmPermissionRequest. The stored caveat is invisible to the
    // SDK's permission check, which matches on parentCapability alone — so the app reads the permission as
    // granted, never asks again, and quietly gets an empty address book until the user clears it in Settings.
    expect(JSON.stringify(result.current.getPermissions(origin))).toContain('userRestricted')
  })

  it('stores no permission at all when a request is dropped without an answer', () => {
    // A distinct origin: the store behind useLocalStorage outlives localStorage.clear().
    const dismissedOrigin = 'https://dismissed.url'
    const { result } = renderHook(() => useSafePermissions())

    act(() => {
      result.current.setPermissionsRequest({
        origin: dismissedOrigin,
        requestId,
        request: [{ requestAddressBook: {} }],
      })
    })
    act(() => {
      result.current.setPermissionsRequest(undefined)
    })

    expect(result.current.getPermissions(dismissedOrigin)).toEqual([])
  })
})
