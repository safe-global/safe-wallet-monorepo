import { createListenerMiddleware } from '@reduxjs/toolkit'
import type { RootState } from '@/store/index'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { cgwApi as usersApi } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { workspaceTrackingListener } from '../workspaceTrackingListener'

jest.mock('@/services/analytics', () => ({ ...jest.requireActual('@/services/analytics'), trackEvent: jest.fn() }))

const spaceId = 'space-1'
const safe = { chainId: '1', address: '0x1' }

const mutation = (
  endpointName: string,
  originalArgs: object,
  payload?: unknown,
  requestStatus: 'fulfilled' | 'rejected' = 'fulfilled',
) => ({
  type: `${spacesApi.reducerPath}/executeMutation/${requestStatus}`,
  payload,
  meta: { requestStatus, arg: { type: 'mutation', endpointName, originalArgs } },
})

describe('workspaceTrackingListener', () => {
  const listenerMiddleware = createListenerMiddleware<RootState>()
  const run = (action: ReturnType<typeof mutation>) =>
    listenerMiddleware.middleware({ getState: () => ({}) as RootState, dispatch: jest.fn() })(jest.fn())(action)

  beforeEach(() => {
    listenerMiddleware.clearListeners()
    workspaceTrackingListener(listenerMiddleware)
    jest.clearAllMocks()
    jest.spyOn(usersApi.endpoints.usersGetWithWalletsV1, 'select').mockReturnValue(() => ({ data: { id: 7 } }) as never)
    jest
      .spyOn(spacesApi.endpoints.membersGetMembershipV1, 'select')
      .mockReturnValue(() => ({ data: { role: 'ADMIN' } }) as never)
    jest
      .spyOn(spacesApi.endpoints.membersGetUsersV1, 'select')
      .mockReturnValue(() => ({ data: { members: [{ user: { id: 9 }, role: 'MEMBER' }] } }) as never)
  })

  it.each([
    [
      'spacesCreateV1',
      mutation('spacesCreateV1', { createSpaceDto: { name: 'A' } }, { uuid: spaceId }),
      [[{ ...SPACE_EVENTS.WORKSPACE_CREATED, label: spaceId }, { workspace_id: spaceId }]],
    ],
    ['spacesDeleteV1', mutation('spacesDeleteV1', { id: spaceId }), [[{ ...SPACE_EVENTS.DELETE_SPACE }]]],
    ['membersSelfRemoveV1', mutation('membersSelfRemoveV1', { spaceId }), [[{ ...SPACE_EVENTS.LEAVE_SPACE }]]],
    [
      'membersInviteUserV1',
      mutation('membersInviteUserV1', { spaceId, inviteUsersDto: { users: [{}, {}] } }, [
        { userId: 1, role: 'ADMIN' },
        { userId: 2, role: 'MEMBER' },
      ]),
      [
        [
          { ...SPACE_EVENTS.WORKSPACE_MEMBER_INVITE_SENT, label: spaceId },
          { workspace_id: spaceId, user_id: 1, role: 'admin', batch_size: 2 },
        ],
        [
          { ...SPACE_EVENTS.WORKSPACE_MEMBER_INVITE_SENT, label: spaceId },
          { workspace_id: spaceId, user_id: 2, role: 'member', batch_size: 2 },
        ],
      ],
    ],
    [
      'membersRemoveUserV1',
      mutation('membersRemoveUserV1', { spaceId, userId: 9 }),
      [
        [
          { ...SPACE_EVENTS.WORKSPACE_MEMBER_REMOVED, label: spaceId },
          { workspace_id: spaceId, removed_by_role: 'admin' },
        ],
      ],
    ],
    [
      'membersAcceptInviteV1',
      mutation('membersAcceptInviteV1', { spaceId, acceptInviteDto: { name: 'A' } }),
      [
        [
          { ...SPACE_EVENTS.WORKSPACE_MEMBER_INVITE_ACCEPTED, label: spaceId },
          { workspace_id: spaceId, user_id: 7 },
        ],
      ],
    ],
    [
      'membersUpdateAliasV1',
      mutation('membersUpdateAliasV1', { spaceId, updateMemberAliasDto: { alias: 'A' } }),
      [
        [
          { ...SPACE_EVENTS.WORKSPACE_MEMBER_NAME_CHANGED, label: spaceId },
          { workspace_id: spaceId, user_id: 7 },
        ],
      ],
    ],
    [
      'membersUpdateRoleV1',
      mutation('membersUpdateRoleV1', { spaceId, userId: 9, updateRoleDto: { role: 'ADMIN' } }),
      [
        [
          { ...SPACE_EVENTS.WORKSPACE_MEMBER_ROLE_CHANGED, label: spaceId },
          { workspace_id: spaceId, target_user_id: 9, from_role: 'member', to_role: 'admin' },
        ],
      ],
    ],
    [
      'spaceSafesCreateV1',
      mutation('spaceSafesCreateV1', { spaceId, createSpaceSafesDto: { safes: [safe] } }),
      [
        [
          { ...SPACE_EVENTS.WORKSPACE_SAFE_LINKED, label: spaceId },
          { workspace_id: spaceId, safe_address: '0x1', chain_id: '1' },
        ],
      ],
    ],
    [
      'spaceSafesDeleteV1',
      mutation('spaceSafesDeleteV1', { spaceId, deleteSpaceSafesDto: { safes: [safe] } }),
      [
        [
          { ...SPACE_EVENTS.WORKSPACE_SAFE_UNLINKED, label: spaceId },
          { workspace_id: spaceId, safe_address: '0x1', chain_id: '1' },
        ],
      ],
    ],
    [
      'addressBookRequestsApproveRequestV1',
      mutation('addressBookRequestsApproveRequestV1', { spaceId, requestId: 1 }),
      [[SPACE_EVENTS.ADDRESS_REQUEST_APPROVED]],
    ],
    [
      'addressBookRequestsRejectRequestV1',
      mutation('addressBookRequestsRejectRequestV1', { spaceId, requestId: 1 }),
      [[SPACE_EVENTS.ADDRESS_REQUEST_REJECTED]],
    ],
  ])('tracks a successful %s', (_, action, calls) => {
    run(action)

    expect(jest.mocked(trackEvent).mock.calls).toEqual(calls)
  })

  it('does not track a failed request', () => {
    run(mutation('spacesDeleteV1', { id: spaceId }, undefined, 'rejected'))

    expect(trackEvent).not.toHaveBeenCalled()
  })
})
