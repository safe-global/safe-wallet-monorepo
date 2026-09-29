import { renderHook } from '@/tests/test-utils'
import { MemberStatus } from '../useSpaceMembers'
import { getSafeWorkspaceAction, useSafeWorkspaceCheck, type SafeWorkspaceState } from '../useSafeWorkspaceCheck'

const SPACE_ID = '11111111-1111-1111-1111-111111111111'
const SAFE_ADDRESS = '0x0000000000000000000000000000000000000001'
const USER_ID = 7

const mockSpace = jest.fn()
const mockSpaceSafes = jest.fn()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesGetOneV1Query: () => mockSpace(),
  useSpaceSafesGetV1Query: () => mockSpaceSafes(),
}))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  useUsersGetWithWalletsV1Query: () => ({ currentData: { id: USER_ID } }),
}))
let mockChainId = '1'
jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: () => mockChainId }))
jest.mock('@/hooks/useSafeAddressFromUrl', () => ({ useSafeAddressFromUrl: () => SAFE_ADDRESS }))

const mockShowNotification = jest.fn((payload: unknown) => ({ type: 'notifications/test', payload }))
jest.mock('@/store/notificationsSlice', () => ({
  ...jest.requireActual('@/store/notificationsSlice'),
  showNotification: (payload: unknown) => mockShowNotification(payload),
}))

const signedInAuth = {
  auth: {
    sessionExpiresAt: Date.now() + 60_000,
    landingSpaceHint: null,
    isStoreHydrated: true,
    cfSafeSynced: false,
    isOidcLoginPending: false,
    isSessionCheckPending: false,
  },
}

const state = (overrides: Partial<SafeWorkspaceState> = {}): SafeWorkspaceState => ({
  rawSpaceId: SPACE_ID,
  isSafeRoute: true,
  isSessionPending: false,
  isSignedIn: true,
  hasNoAccess: false,
  membershipStatus: MemberStatus.ACTIVE,
  isSafeInSpace: true,
  ...overrides,
})

describe('getSafeWorkspaceAction', () => {
  it.each<[string, Partial<SafeWorkspaceState>, ReturnType<typeof getSafeWorkspaceAction>]>([
    ['a page that is not a Safe page', { isSafeRoute: false }, 'none'],
    ['a URL without a Workspace', { rawSpaceId: undefined }, 'none'],
    ['a malformed spaceId', { rawSpaceId: 'space-1' }, 'remove'],
    ['a repeated spaceId', { rawSpaceId: [SPACE_ID, SPACE_ID] }, 'remove'],
    ['a session check in progress', { isSessionPending: true }, 'wait'],
    ['a signed-out user, who gets a sign-in prompt', { isSignedIn: false }, 'signIn'],
    ['a user without access to the Workspace', { hasNoAccess: true }, 'removeNotMember'],
    ['a membership that is still loading', { membershipStatus: undefined }, 'wait'],
    ['an invited member', { membershipStatus: MemberStatus.INVITED }, 'none'],
    ['a member who declined', { membershipStatus: MemberStatus.DECLINED }, 'removeNotMember'],
    ['a user missing from the member list', { membershipStatus: null }, 'removeNotMember'],
    ['Workspace Safes that are still loading', { isSafeInSpace: undefined }, 'wait'],
    ['a Safe that is not in the Workspace', { isSafeInSpace: false }, 'remove'],
    ['an active member on a Safe of the Workspace', {}, 'none'],
  ])('returns the action for %s', (_, overrides, expected) => {
    expect(getSafeWorkspaceAction(state(overrides))).toBe(expected)
  })
})

describe('useSafeWorkspaceCheck', () => {
  const renderCheck = (replace = jest.fn(() => Promise.resolve(true)), pathname = '/home') => {
    renderHook(() => useSafeWorkspaceCheck(), {
      initialReduxState: signedInAuth,
      routerProps: { pathname, query: { safe: `eth:${SAFE_ADDRESS}`, spaceId: SPACE_ID }, replace },
    })
    return replace
  }

  beforeEach(() => {
    jest.clearAllMocks()
    window.localStorage.clear()
    mockChainId = '1'
    mockSpace.mockReturnValue({
      currentData: { members: [{ user: { id: USER_ID }, status: MemberStatus.ACTIVE }] },
      error: undefined,
    })
    mockSpaceSafes.mockReturnValue({ currentData: { safes: { '1': [SAFE_ADDRESS] } } })
  })

  it('keeps the Workspace when the member opens a Safe of the Workspace', () => {
    const replace = renderCheck()

    expect(replace).not.toHaveBeenCalled()
  })

  it('waits while the chain of the URL is still unresolved', () => {
    mockChainId = ''

    const replace = renderCheck()

    expect(replace).not.toHaveBeenCalled()
  })

  it.each(['/spaces', '/spaces/safe-accounts', '/welcome/spaces'])(
    'leaves %s alone, because a Workspace page with a Safe in its query is not a Safe page',
    (pathname) => {
      mockSpaceSafes.mockReturnValue({ currentData: { safes: { '1': [] } } })

      const replace = renderCheck(undefined, pathname)

      expect(replace).not.toHaveBeenCalled()
    },
  )

  it('removes the Workspace from the URL when the Safe is not in it', () => {
    mockSpaceSafes.mockReturnValue({ currentData: { safes: { '1': [] } } })

    const replace = renderCheck()

    expect(replace).toHaveBeenCalledWith({ pathname: '/home', query: { safe: `eth:${SAFE_ADDRESS}` } }, undefined, {
      shallow: true,
    })
    expect(mockShowNotification).not.toHaveBeenCalled()
  })

  it('removes the Workspace once, even when the page renders again before the removal lands', () => {
    mockSpaceSafes.mockReturnValue({ currentData: { safes: { '1': [] } } })
    const replace = jest.fn(() => Promise.resolve(true))
    const { rerender } = renderHook(() => useSafeWorkspaceCheck(), {
      initialReduxState: signedInAuth,
      routerProps: { pathname: '/home', query: { safe: `eth:${SAFE_ADDRESS}`, spaceId: SPACE_ID }, replace },
    })

    rerender()

    expect(replace).toHaveBeenCalledTimes(1)
  })

  it('removes the Workspace and tells a user who is not a member', () => {
    mockSpace.mockReturnValue({ currentData: undefined, error: { status: 404, data: {} } })

    const replace = renderCheck()

    expect(replace).toHaveBeenCalledWith({ pathname: '/home', query: { safe: `eth:${SAFE_ADDRESS}` } }, undefined, {
      shallow: true,
    })
    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.objectContaining({ groupKey: 'safe-workspace-not-member', variant: 'info' }),
    )
  })
})
