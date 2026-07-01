import { type MemberDto, useMembersRenewInviteV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from '@/features/spaces'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'

/**
 * Renew a pending invitation (resends the email for email invites).
 * Shared by the desktop renew button and the mobile actions menu.
 */
const useRenewInvite = (member: MemberDto) => {
  const spaceId = useCurrentSpaceId()
  const dispatch = useAppDispatch()
  const [renewInvite, { isLoading }] = useMembersRenewInviteV1Mutation()

  const handleRenew = async () => {
    if (!spaceId) return

    const { error } = await renewInvite({ spaceId, userId: member.user.id })

    if (error) {
      dispatch(
        showNotification({
          message: getRtkQueryErrorMessage(error) || 'Failed to renew the invitation. Please try again.',
          variant: 'error',
          groupKey: 'renew-invite-error',
        }),
      )
      return
    }

    dispatch(
      showNotification({
        message: `Invitation renewed for ${member.name}`,
        variant: 'success',
        groupKey: 'renew-invite-success',
      }),
    )
  }

  return { renewInvite: handleRenew, isLoading }
}

export default useRenewInvite
