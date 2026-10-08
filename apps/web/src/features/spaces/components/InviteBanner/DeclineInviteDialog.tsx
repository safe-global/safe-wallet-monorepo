import { useState } from 'react'
import { useDarkMode } from '@/hooks/useDarkMode'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useMembersDeclineInviteV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import { DeclineInviteDialogView } from '@views/features/spaces/components/InviteBanner/DeclineInviteDialogView'

type DeclineInviteDialogProps = {
  space: GetSpaceResponse
  onClose: () => void
}

const DeclineInviteDialog = ({ space, onClose }: DeclineInviteDialogProps) => {
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [declineInvite] = useMembersDeclineInviteV1Mutation()
  const dispatch = useAppDispatch()
  const isDarkMode = useDarkMode()

  const handleConfirm = async () => {
    setErrorMessage('')
    trackEvent({ ...SPACE_EVENTS.DECLINE_INVITE_SUBMIT, label: space.uuid }, { workspace_id: space.uuid })
    try {
      const { error } = await declineInvite({ spaceId: space.uuid })

      if (error) {
        throw error
      }

      onClose()

      dispatch(
        showNotification({
          message: `Declined invite to ${space.name}`,
          variant: 'success',
          groupKey: 'decline-invite-success',
        }),
      )
    } catch (e) {
      setErrorMessage('An unexpected error occurred while declining the invitation.')
    }
  }

  return (
    <DeclineInviteDialogView
      spaceName={space.name}
      onClose={onClose}
      onConfirm={handleConfirm}
      isDarkMode={isDarkMode}
      errorMessage={errorMessage}
    />
  )
}

export default DeclineInviteDialog
