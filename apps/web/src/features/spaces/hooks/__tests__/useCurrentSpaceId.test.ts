import { renderHook } from '@/tests/test-utils'
import { useCurrentSpaceId } from '../useCurrentSpaceId'

const URL_SPACE_ID = '11111111-1111-1111-1111-111111111111'
const STORED_SPACE_ID = '22222222-2222-2222-2222-222222222222'

const authWithStoredSpace = {
  auth: {
    sessionExpiresAt: Date.now() + 60_000,
    landingSpaceHint: STORED_SPACE_ID,
    isStoreHydrated: true,
    cfSafeSynced: false,
    isOidcLoginPending: false,
    isSessionCheckPending: false,
  },
}

describe('useCurrentSpaceId', () => {
  beforeEach(() => window.localStorage.clear())

  it('returns the Workspace of the URL, not the one another tab stored', () => {
    const { result } = renderHook(() => useCurrentSpaceId(), {
      initialReduxState: authWithStoredSpace,
      routerProps: { query: { spaceId: URL_SPACE_ID } },
    })

    expect(result.current).toBe(URL_SPACE_ID)
  })

  it('returns null outside a Workspace, even with a stored Workspace', () => {
    const { result } = renderHook(() => useCurrentSpaceId(), { initialReduxState: authWithStoredSpace })

    expect(result.current).toBeNull()
  })
})
