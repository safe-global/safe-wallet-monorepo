import { createListenerMiddleware } from '@reduxjs/toolkit'
import type { RootState } from '@/store/index'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { cgwApi as usersApi } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { spaceAddressBookItemBuilder, spaceAddressBookTagBuilder } from '@/tests/builders/space'
import { countTagChanges, workspaceTrackingListener } from '../workspaceTrackingListener'

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
    [
      'spacesUpdateV1',
      mutation(
        'spacesUpdateV1',
        { id: spaceId, updateSpaceDto: { experimentalFeatures: ['POLICY_RECIPIENT_ALLOWLIST'] } },
        { uuid: spaceId },
      ),
      [
        [
          { ...SPACE_EVENTS.WORKSPACE_UPDATED, label: spaceId },
          {
            [MixpanelEventParams.SOURCE]: 'experimental_features',
            workspace_id: spaceId,
            experimental_features: 'POLICY_RECIPIENT_ALLOWLIST',
          },
        ],
      ],
    ],
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

  it('tracks an experimental features update once when the rejected request is replayed after step-up', () => {
    const originalArgs = { id: spaceId, updateSpaceDto: { experimentalFeatures: ['POLICY_RECIPIENT_ALLOWLIST'] } }
    run(mutation('spacesUpdateV1', originalArgs, { status: 403 }, 'rejected'))
    run(mutation('spacesUpdateV1', originalArgs, { uuid: spaceId }))

    expect(trackEvent).toHaveBeenCalledTimes(1)
  })

  it('does not track a workspace update that only changes the name', () => {
    run(mutation('spacesUpdateV1', { id: spaceId, updateSpaceDto: { name: 'B' } }, { uuid: spaceId }))

    expect(trackEvent).not.toHaveBeenCalled()
  })

  describe('tags', () => {
    const vendor = spaceAddressBookTagBuilder().with({ id: 1, name: 'Vendor', contactCount: 4 }).build()
    const internal = spaceAddressBookTagBuilder().with({ id: 2, name: 'Internal' }).build()
    const contact = spaceAddressBookItemBuilder()
      .with({ tagIds: [1] })
      .build()

    beforeEach(() => {
      jest
        .spyOn(spacesApi.endpoints.addressBooksGetAddressBookItemsV1, 'select')
        .mockReturnValue(() => ({ data: { spaceUuid: spaceId, data: [contact], tags: [vendor, internal] } }) as never)
    })

    it('tracks tags saved from the row menu against the book before the change', () => {
      run(
        mutation('addressBooksSetContactTagsV1', {
          spaceId,
          setContactTagsDto: { items: [{ address: contact.address.toLowerCase(), tags: ['internal', 'EU'] }] },
        }),
      )

      expect(jest.mocked(trackEvent).mock.calls).toEqual([
        [
          SPACE_EVENTS.CONTACT_TAGS_UPDATED,
          {
            [MixpanelEventParams.LOCATION]: 'row_menu',
            [MixpanelEventParams.TAGS_ADDED]: 2,
            [MixpanelEventParams.TAGS_REMOVED]: 1,
            [MixpanelEventParams.TAGS_CREATED]: 1,
            [MixpanelEventParams.MEMBER_ROLE]: 'ADMIN',
          },
        ],
      ])
    })

    it.each([
      ['add_contact', spaceAddressBookItemBuilder().build().address],
      ['edit_contact', contact.address],
    ])('tracks tags saved from the %s dialog', (location, address) => {
      run(
        mutation('addressBooksUpsertAddressBookItemsV1', {
          spaceId,
          upsertAddressBookItemsDto: { items: [{ address, name: 'A', chainIds: ['1'], tags: ['Vendor'] }] },
        }),
      )

      expect(trackEvent).toHaveBeenCalledWith(
        SPACE_EVENTS.CONTACT_TAGS_UPDATED,
        expect.objectContaining({ [MixpanelEventParams.LOCATION]: location }),
      )
    })

    it('does not track an upsert that leaves the tags alone', () => {
      run(
        mutation('addressBooksUpsertAddressBookItemsV1', {
          spaceId,
          upsertAddressBookItemsDto: { items: [{ address: contact.address, name: 'A', chainIds: ['1'] }] },
        }),
      )

      expect(trackEvent).not.toHaveBeenCalled()
    })

    it.each([
      ['a rename', [vendor, internal], false],
      ['a merge', [internal], true],
    ])('tracks %s', (_, tagsAfter, merged) => {
      run(
        mutation(
          'addressBooksRenameTagV1',
          { spaceId, tagId: vendor.id, renameTagDto: { name: 'Internal' } },
          { spaceUuid: spaceId, data: [], tags: tagsAfter },
        ),
      )

      expect(jest.mocked(trackEvent).mock.calls).toEqual([
        [
          SPACE_EVENTS.TAG_RENAMED,
          { [MixpanelEventParams.MERGED]: merged, [MixpanelEventParams.MEMBER_ROLE]: 'ADMIN' },
        ],
      ])
    })

    it('tracks a delete with how many contacts had the tag', () => {
      run(mutation('addressBooksDeleteTagV1', { spaceId, tagId: vendor.id }))

      expect(jest.mocked(trackEvent).mock.calls).toEqual([
        [
          SPACE_EVENTS.TAG_DELETED,
          { [MixpanelEventParams.CONTACT_COUNT]: 4, [MixpanelEventParams.MEMBER_ROLE]: 'ADMIN' },
        ],
      ])
    })

    it('tracks tags once when the rejected request is replayed after step-up', () => {
      const originalArgs = { spaceId, setContactTagsDto: { items: [{ address: contact.address, tags: [] }] } }
      run(mutation('addressBooksSetContactTagsV1', originalArgs, { status: 403 }, 'rejected'))
      run(mutation('addressBooksSetContactTagsV1', originalArgs))

      expect(trackEvent).toHaveBeenCalledTimes(1)
    })
  })
})

describe('countTagChanges', () => {
  it('counts names case-insensitively', () => {
    expect(countTagChanges(['Vendor', 'EU'], ['vendor', 'Payroll'], ['VENDOR', 'eu'])).toEqual({
      [MixpanelEventParams.TAGS_ADDED]: 1,
      [MixpanelEventParams.TAGS_REMOVED]: 1,
      [MixpanelEventParams.TAGS_CREATED]: 1,
    })
  })
})
