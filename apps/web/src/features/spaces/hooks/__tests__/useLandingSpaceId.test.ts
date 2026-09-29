import { renderHook } from '@/tests/test-utils'
import { MemberStatus } from '../useSpaceMembers'
import { useLandingSpaceId } from '../useLandingSpaceId'

const USER_ID = 7
const FIRST = '11111111-1111-1111-1111-111111111111'
const SECOND = '22222222-2222-2222-2222-222222222222'
const INVITED = '33333333-3333-3333-3333-333333333333'

const space = (uuid: string, status: MemberStatus) => ({ uuid, members: [{ user: { id: USER_ID }, status }] })

const mockSpaces = jest.fn()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesGetV1Query: () => mockSpaces(),
}))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  useUsersGetWithWalletsV1Query: () => ({ currentData: { id: USER_ID }, isLoading: false }),
}))

const renderLanding = (hint: string | null) =>
  renderHook(() => useLandingSpaceId(), {
    initialReduxState: {
      auth: {
        sessionExpiresAt: Date.now() + 60_000,
        lastUsedSpace: hint,
        isStoreHydrated: true,
        cfSafeSynced: false,
        isOidcLoginPending: false,
        isSessionCheckPending: false,
      },
    },
  })

describe('useLandingSpaceId', () => {
  beforeEach(() => {
    window.localStorage.clear()
    mockSpaces.mockReturnValue({
      currentData: [
        space(INVITED, MemberStatus.INVITED),
        space(FIRST, MemberStatus.ACTIVE),
        space(SECOND, MemberStatus.ACTIVE),
      ],
      isLoading: false,
    })
  })

  it('returns the last Workspace used', () => {
    const { result } = renderLanding(SECOND)

    expect(result.current).toEqual({ spaceId: SECOND, isLoading: false })
  })

  it('returns the first active Workspace when the last one used is gone', () => {
    const { result } = renderLanding('44444444-4444-4444-4444-444444444444')

    expect(result.current.spaceId).toBe(FIRST)
  })

  it('does not land in a Workspace that the user is only invited to', () => {
    const { result } = renderLanding(INVITED)

    expect(result.current.spaceId).toBe(FIRST)
  })

  it('returns null when the user has no active Workspace', () => {
    mockSpaces.mockReturnValue({ currentData: [space(INVITED, MemberStatus.INVITED)], isLoading: false })

    const { result } = renderLanding(null)

    expect(result.current).toEqual({ spaceId: null, isLoading: false })
  })

  it('reports loading while the Workspaces load', () => {
    mockSpaces.mockReturnValue({ currentData: undefined, isLoading: true })

    const { result } = renderLanding(SECOND)

    expect(result.current.isLoading).toBe(true)
  })
})
