import { renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { Provider } from 'react-redux'
import * as spacesQueries from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import * as usersQueries from '@safe-global/store/gateway/AUTO_GENERATED/users'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { UserWithWallets } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { makeStore } from '@/store'
import { selectNotifications } from '@/store/notificationsSlice'
import { AppRoutes } from '@/config/routes'
import { MemberStatus } from '@/features/spaces/hooks/useSpaceMembers'
import { useInviteNotification } from '../useInviteNotification'

jest.mock('@/store/authSlice', () => ({
  ...jest.requireActual('@/store/authSlice'),
  isAuthenticated: jest.fn(() => true),
}))

let mockPathname = '/some-other-page'
jest.mock('next/router', () => ({
  useRouter: () => ({ pathname: mockPathname }),
}))

import { isAuthenticated } from '@/store/authSlice'

const CURRENT_USER: UserWithWallets = { id: 7, wallets: [] } as unknown as UserWithWallets

const makeSpace = (uuid: string, name: string, status: MemberStatus): GetSpaceResponse =>
  ({
    uuid,
    name,
    members: [{ id: 1, user: { id: CURRENT_USER.id }, status }],
    memberCount: 1,
    safeCount: 0,
  }) as unknown as GetSpaceResponse

const mockUser = (user: UserWithWallets | undefined) => {
  jest.spyOn(usersQueries, 'useUsersGetWithWalletsV1Query').mockReturnValue({
    currentData: user,
  } as unknown as ReturnType<typeof usersQueries.useUsersGetWithWalletsV1Query>)
}

const mockSpaces = (spaces: GetSpaceResponse[] | undefined) => {
  jest.spyOn(spacesQueries, 'useSpacesGetV1Query').mockReturnValue({
    currentData: spaces,
  } as unknown as ReturnType<typeof spacesQueries.useSpacesGetV1Query>)
}

const renderWithStore = () => {
  const store = makeStore(undefined, { skipBroadcast: true })
  const wrapper = ({ children }: { children: ReactNode }) => createElement(Provider, { store, children })
  const utils = renderHook(() => useInviteNotification(), { wrapper })
  return { store, ...utils }
}

const inviteMessages = (store: ReturnType<typeof makeStore>) =>
  selectNotifications(store.getState()).map((n) => n.message)

describe('useInviteNotification', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockPathname = '/some-other-page'
    ;(isAuthenticated as unknown as jest.Mock).mockReturnValue(true)
    mockUser(CURRENT_USER)
  })

  it('dispatches one notification per pending INVITED space on mount', () => {
    mockSpaces([
      makeSpace('space-a', 'Workspace A', MemberStatus.INVITED),
      makeSpace('space-b', 'Workspace B', MemberStatus.INVITED),
      makeSpace('space-c', 'Workspace C', MemberStatus.ACTIVE),
    ])

    const { store } = renderWithStore()

    expect(inviteMessages(store)).toEqual([
      "You've been invited to join Workspace A",
      "You've been invited to join Workspace B",
    ])
  })

  it('dispatches an info notification grouped and linked to the invite', () => {
    mockSpaces([makeSpace('space-a', 'Workspace A', MemberStatus.INVITED)])

    const { store } = renderWithStore()

    const [notification] = selectNotifications(store.getState())
    expect(notification).toMatchObject({
      variant: 'info',
      message: "You've been invited to join Workspace A",
      groupKey: 'space-invite-space-a',
      link: { href: AppRoutes.welcome.spaces, title: 'View invite' },
    })
  })

  it('dispatches nothing when spaces resolve before the current user', () => {
    mockUser(undefined)
    mockSpaces([makeSpace('space-a', 'Workspace A', MemberStatus.INVITED)])

    const { store } = renderWithStore()

    expect(inviteMessages(store)).toEqual([])
  })

  it('does not re-dispatch for the same invite within a session on re-render', () => {
    mockSpaces([makeSpace('space-a', 'Workspace A', MemberStatus.INVITED)])

    const { store, rerender } = renderWithStore()
    rerender()
    rerender()

    expect(inviteMessages(store)).toEqual(["You've been invited to join Workspace A"])
  })

  it('dispatches once for a space that newly appears in the INVITED list mid-session', () => {
    mockSpaces([makeSpace('space-a', 'Workspace A', MemberStatus.INVITED)])

    const { store, rerender } = renderWithStore()

    mockSpaces([
      makeSpace('space-a', 'Workspace A', MemberStatus.INVITED),
      makeSpace('space-b', 'Workspace B', MemberStatus.INVITED),
    ])
    rerender()

    expect(inviteMessages(store)).toEqual([
      "You've been invited to join Workspace A",
      "You've been invited to join Workspace B",
    ])
  })

  it('re-dispatches on a fresh mount while the invite is still INVITED', () => {
    mockSpaces([makeSpace('space-a', 'Workspace A', MemberStatus.INVITED)])

    const { store } = renderWithStore()
    expect(inviteMessages(store)).toEqual(["You've been invited to join Workspace A"])

    const second = renderWithStore()
    expect(inviteMessages(second.store)).toEqual(["You've been invited to join Workspace A"])
  })

  it('dispatches nothing when there are no invites', () => {
    mockSpaces([makeSpace('space-c', 'Workspace C', MemberStatus.ACTIVE)])

    const { store } = renderWithStore()

    expect(inviteMessages(store)).toEqual([])
  })

  it('dispatches nothing when the user is signed out (queries skipped)', () => {
    ;(isAuthenticated as unknown as jest.Mock).mockReturnValue(false)
    mockUser(undefined)
    mockSpaces(undefined)

    const { store } = renderWithStore()

    expect(inviteMessages(store)).toEqual([])
  })

  it('stops notifying once a space leaves the INVITED list and notifies again on re-invite', () => {
    mockSpaces([makeSpace('space-a', 'Workspace A', MemberStatus.INVITED)])
    const { store, rerender } = renderWithStore()
    expect(inviteMessages(store)).toEqual(["You've been invited to join Workspace A"])

    mockSpaces([makeSpace('space-a', 'Workspace A', MemberStatus.ACTIVE)])
    rerender()
    expect(inviteMessages(store)).toEqual(["You've been invited to join Workspace A"])

    mockSpaces([makeSpace('space-a', 'Workspace A', MemberStatus.INVITED)])
    rerender()
    expect(inviteMessages(store)).toEqual([
      "You've been invited to join Workspace A",
      "You've been invited to join Workspace A",
    ])
  })

  it('dispatches nothing while on the workspace list page where the invite banner already shows', () => {
    mockPathname = AppRoutes.welcome.spaces
    mockSpaces([makeSpace('space-a', 'Workspace A', MemberStatus.INVITED)])

    const { store } = renderWithStore()

    expect(inviteMessages(store)).toEqual([])
  })

  it('dispatches the suppressed invite once the user navigates away from the workspace list page', () => {
    mockPathname = AppRoutes.welcome.spaces
    mockSpaces([makeSpace('space-a', 'Workspace A', MemberStatus.INVITED)])

    const { store, rerender } = renderWithStore()
    expect(inviteMessages(store)).toEqual([])

    mockPathname = '/some-other-page'
    rerender()

    expect(inviteMessages(store)).toEqual(["You've been invited to join Workspace A"])
  })
})
