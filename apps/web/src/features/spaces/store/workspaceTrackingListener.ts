import type { listenerMiddlewareInstance } from '@/store/index'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { cgwApi as usersApi } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'

export const workspaceTrackingListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  const endpoints = spacesApi?.endpoints
  // Tests that mock the spaces module leave no endpoint to watch.
  if (!endpoints) return
  const { startListening } = listenerMiddleware
  // RootState types the shared gateway reducer without the users and spaces tags; the cache entries are the same.
  const currentUserId = (state: unknown) => {
    const select = usersApi.endpoints.usersGetWithWalletsV1.select()
    return select(state as Parameters<typeof select>[0]).data?.id
  }

  startListening({
    matcher: endpoints.spacesCreateV1.matchFulfilled,
    effect: ({ payload }) => {
      trackEvent({ ...SPACE_EVENTS.WORKSPACE_CREATED, label: payload.uuid }, { workspace_id: payload.uuid })
    },
  })

  startListening({
    matcher: endpoints.spacesDeleteV1.matchFulfilled,
    effect: () => trackEvent({ ...SPACE_EVENTS.DELETE_SPACE }),
  })

  // Name updates are tracked by the form that submits them (useUpdateSpace).
  startListening({
    matcher: endpoints.spacesUpdateV1.matchFulfilled,
    effect: ({ meta }) => {
      const { id, updateSpaceDto } = meta.arg.originalArgs
      if (!updateSpaceDto.experimentalFeatures) return
      trackEvent(
        { ...SPACE_EVENTS.WORKSPACE_UPDATED, label: id },
        {
          [MixpanelEventParams.SOURCE]: 'experimental_features',
          workspace_id: id,
          experimental_features: updateSpaceDto.experimentalFeatures.join(','),
        },
      )
    },
  })

  startListening({
    matcher: endpoints.membersSelfRemoveV1.matchFulfilled,
    effect: () => trackEvent({ ...SPACE_EVENTS.LEAVE_SPACE }),
  })

  startListening({
    matcher: endpoints.membersInviteUserV1.matchFulfilled,
    effect: ({ payload, meta }) => {
      const { spaceId, inviteUsersDto } = meta.arg.originalArgs
      payload.forEach((invitation) => {
        trackEvent(
          { ...SPACE_EVENTS.WORKSPACE_MEMBER_INVITE_SENT, label: spaceId },
          {
            workspace_id: spaceId,
            user_id: invitation.userId,
            role: invitation.role.toLowerCase(),
            batch_size: inviteUsersDto.users.length,
          },
        )
      })
    },
  })

  startListening({
    matcher: endpoints.membersRemoveUserV1.matchFulfilled,
    effect: ({ meta }, { getState }) => {
      const { spaceId } = meta.arg.originalArgs
      const select = endpoints.membersGetMembershipV1.select({ spaceId })
      const remover = select(getState() as unknown as Parameters<typeof select>[0]).data
      trackEvent(
        { ...SPACE_EVENTS.WORKSPACE_MEMBER_REMOVED, label: spaceId },
        { workspace_id: spaceId, removed_by_role: remover?.role.toLowerCase() },
      )
    },
  })

  startListening({
    matcher: endpoints.membersAcceptInviteV1.matchFulfilled,
    effect: ({ meta }, { getState }) => {
      const { spaceId } = meta.arg.originalArgs
      trackEvent(
        { ...SPACE_EVENTS.WORKSPACE_MEMBER_INVITE_ACCEPTED, label: spaceId },
        { workspace_id: spaceId, user_id: currentUserId(getState()) },
      )
    },
  })

  startListening({
    matcher: endpoints.membersUpdateAliasV1.matchFulfilled,
    effect: ({ meta }, { getState }) => {
      const { spaceId } = meta.arg.originalArgs
      trackEvent(
        { ...SPACE_EVENTS.WORKSPACE_MEMBER_NAME_CHANGED, label: spaceId },
        { workspace_id: spaceId, user_id: currentUserId(getState()) },
      )
    },
  })

  startListening({
    matcher: endpoints.membersUpdateRoleV1.matchFulfilled,
    effect: ({ meta }, { getOriginalState }) => {
      const { spaceId, userId, updateRoleDto } = meta.arg.originalArgs
      const select = endpoints.membersGetUsersV1.select({ spaceId })
      // The member list is refetched after the update, so read the role from before it.
      const members = select(getOriginalState() as unknown as Parameters<typeof select>[0]).data?.members
      const fromRole = members?.find((member) => member.user.id === userId)?.role
      trackEvent(
        { ...SPACE_EVENTS.WORKSPACE_MEMBER_ROLE_CHANGED, label: spaceId },
        {
          workspace_id: spaceId,
          target_user_id: userId,
          from_role: fromRole?.toLowerCase(),
          to_role: updateRoleDto.role.toLowerCase(),
        },
      )
    },
  })

  startListening({
    matcher: endpoints.spaceSafesCreateV1.matchFulfilled,
    effect: ({ meta }) => {
      const { spaceId, createSpaceSafesDto } = meta.arg.originalArgs
      createSpaceSafesDto.safes.forEach(({ chainId, address }) => {
        trackEvent(
          { ...SPACE_EVENTS.WORKSPACE_SAFE_LINKED, label: spaceId },
          { workspace_id: spaceId, safe_address: address, chain_id: chainId },
        )
      })
    },
  })

  startListening({
    matcher: endpoints.spaceSafesDeleteV1.matchFulfilled,
    effect: ({ meta }) => {
      const { spaceId, deleteSpaceSafesDto } = meta.arg.originalArgs
      deleteSpaceSafesDto.safes.forEach(({ chainId, address }) => {
        trackEvent(
          { ...SPACE_EVENTS.WORKSPACE_SAFE_UNLINKED, label: spaceId },
          { workspace_id: spaceId, safe_address: address, chain_id: chainId },
        )
      })
    },
  })

  startListening({
    matcher: endpoints.addressBookRequestsApproveRequestV1.matchFulfilled,
    effect: () => trackEvent(SPACE_EVENTS.ADDRESS_REQUEST_APPROVED),
  })

  startListening({
    matcher: endpoints.addressBookRequestsRejectRequestV1.matchFulfilled,
    effect: () => trackEvent(SPACE_EVENTS.ADDRESS_REQUEST_REJECTED),
  })
}
