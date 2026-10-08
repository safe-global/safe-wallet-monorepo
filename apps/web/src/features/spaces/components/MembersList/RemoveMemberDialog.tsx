import { useMembersRemoveUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from '@/features/spaces'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useState } from 'react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import { useCurrentMemberProfile } from '../../hooks/useSpaceMembers'
import { isElevationRequiredError } from '@/features/oidc-auth/utils/elevation'
import { RemoveMemberDialogView } from '@views/features/spaces/components/MembersList/RemoveMemberDialogView'

const RemoveMemberDialog = ({
  userId,
  memberName,
  handleClose,
  isInvite = false,
}: {
  userId: number
  memberName: string
  handleClose: () => void
  isInvite?: boolean
}) => {
  const spaceId = useCurrentSpaceId()
  const dispatch = useAppDispatch()
  const [deleteMember] = useMembersRemoveUserV1Mutation()
  const [errorMessage, setErrorMessage] = useState<string>('')
  const { membership } = useCurrentMemberProfile()
  const isDarkMode = useDarkMode()

  const handleConfirm = async () => {
    setErrorMessage('')
    trackEvent({ ...SPACE_EVENTS.REMOVE_MEMBER, label: isInvite ? SPACE_LABELS.invite_list : SPACE_LABELS.member_list })
    try {
      const { error } = await deleteMember({ spaceId: spaceId ?? '', userId })

      if (error) {
        throw error
      }

      trackEvent(
        { ...SPACE_EVENTS.WORKSPACE_MEMBER_REMOVED, label: spaceId ?? undefined },
        { workspace_id: spaceId, removed_by_role: membership?.role.toLowerCase() },
      )

      dispatch(
        showNotification({
          message: `Removed ${memberName} from space`,
          variant: 'success',
          groupKey: 'remove-member-success',
        }),
      )

      handleClose()
    } catch (e) {
      if (isElevationRequiredError(e)) return
      setErrorMessage('An unexpected error occurred while removing the member.')
    }
  }

  return (
    <RemoveMemberDialogView
      memberName={memberName}
      isInvite={isInvite}
      onClose={handleClose}
      onConfirm={handleConfirm}
      isDarkMode={isDarkMode}
      errorMessage={errorMessage}
    />
  )
}

export default RemoveMemberDialog
