import { renderHook } from '@/tests/test-utils'
import * as spacesQueries from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import * as usersQueries from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useWorkspacesView } from '../useWorkspacesView'
import { MemberStatus } from '../useSpaceMembers'
import { SESSION_LIFETIME_MS } from '@/store/authSlice'

const USER_ID = 42
const signedIn = {
  auth: {
    sessionExpiresAt: Date.now() + SESSION_LIFETIME_MS,
    lastUsedSpace: null,
    isStoreHydrated: true,
    cfSafeSynced: false,
    isOidcLoginPending: false,
  },
}

const mockUser = (id: number | undefined = USER_ID, isFetching = false) =>
  jest.spyOn(usersQueries, 'useUsersGetWithWalletsV1Query').mockReturnValue({
    currentData: id === undefined ? undefined : { id },
    isFetching,
  } as unknown as ReturnType<typeof usersQueries.useUsersGetWithWalletsV1Query>)

const mockSpaces = (
  spaces: unknown,
  { isFetching = false, isUninitialized = false, error = undefined }: Record<string, unknown> = {},
) =>
  jest.spyOn(spacesQueries, 'useSpacesGetV1Query').mockReturnValue({
    currentData: spaces,
    isFetching,
    isUninitialized,
    error,
  } as unknown as ReturnType<typeof spacesQueries.useSpacesGetV1Query>)

const makeSpace = (uuid: string, status: MemberStatus) => ({
  uuid,
  name: uuid,
  members: [{ user: { id: USER_ID }, status }],
})

describe('useWorkspacesView', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    mockUser()
    mockSpaces([])
  })

  it('returns "signed-out" when the user is not authenticated', () => {
    const { result } = renderHook(() => useWorkspacesView())
    expect(result.current.kind).toBe('signed-out')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.activeSpaces).toEqual([])
    expect(result.current.pendingInvites).toEqual([])
  })

  it('returns "has-workspaces" with the active spaces when signed in', () => {
    const active = makeSpace('a', MemberStatus.ACTIVE)
    mockSpaces([active, makeSpace('b', MemberStatus.INVITED)])

    const { result } = renderHook(() => useWorkspacesView(), { initialReduxState: signedIn })

    expect(result.current.kind).toBe('has-workspaces')
    expect(result.current.activeSpaces).toHaveLength(1)
    expect(result.current.pendingInvites).toHaveLength(1)
  })

  it('returns "no-workspaces" when signed in with only pending invites', () => {
    mockSpaces([makeSpace('b', MemberStatus.INVITED)])

    const { result } = renderHook(() => useWorkspacesView(), { initialReduxState: signedIn })

    expect(result.current.kind).toBe('no-workspaces')
    expect(result.current.activeSpaces).toHaveLength(0)
    expect(result.current.pendingInvites).toHaveLength(1)
  })

  it('reports loading while the spaces query is fetching', () => {
    mockSpaces(undefined, { isFetching: true })

    const { result } = renderHook(() => useWorkspacesView(), { initialReduxState: signedIn })

    expect(result.current.isLoading).toBe(true)
  })

  it('reports loading during the skip→unskip lag (spaces undefined, no error)', () => {
    mockSpaces(undefined, { isFetching: false, isUninitialized: false })

    const { result } = renderHook(() => useWorkspacesView(), { initialReduxState: signedIn })

    expect(result.current.isLoading).toBe(true)
  })
})
