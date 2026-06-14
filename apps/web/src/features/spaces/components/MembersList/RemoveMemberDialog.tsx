import ModalDialog from '@/components/common/ModalDialog'
import { useMembersRemoveUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from '@/features/spaces'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useState } from 'react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import { useCurrentMemberProfile } from '../../hooks/useSpaceMembers'

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
      setErrorMessage('An unexpected error occurred while removing the member.')
    }
  }

  return (
    <ModalDialog
      open
      onClose={handleClose}
      dialogTitle={isInvite ? 'Remove invitation' : 'Remove member'}
      hideChainIndicator
    >
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <div className="p-6">
          <Typography variant="paragraph">
            {isInvite ? `Are you sure you want to remove the invitation for ` : `Are you sure you want to remove `}
            <b>{memberName}</b>
            {isInvite ? `` : ` from this space?`}
          </Typography>
          {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        </div>

        <div className="flex justify-end gap-2 px-6 pb-6">
          <Button variant="ghost" data-testid="cancel-btn" onClick={handleClose}>
            Cancel
          </Button>
          <Button data-testid="delete-btn" onClick={handleConfirm} variant="destructive">
            Remove
          </Button>
        </div>
      </div>
    </ModalDialog>
  )
}

export default RemoveMemberDialog
