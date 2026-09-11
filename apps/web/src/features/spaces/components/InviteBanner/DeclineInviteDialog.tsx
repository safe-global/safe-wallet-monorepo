import { useState } from 'react'
import ModalDialog from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useMembersDeclineInviteV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'

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
    <ModalDialog open onClose={onClose} dialogTitle="Decline invitation" hideChainIndicator>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <div className="p-6">
          <Typography variant="paragraph">
            Are you sure you want to decline the invitation to <b>{space.name}</b>?
          </Typography>
          {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        </div>

        <DialogActions
          className="px-6 pb-6"
          onCancel={onClose}
          cancelTestId="cancel-btn"
          confirmLabel="Decline"
          onConfirm={handleConfirm}
          confirmDestructive
          confirmTestId="decline-btn"
        />
      </div>
    </ModalDialog>
  )
}

export default DeclineInviteDialog
