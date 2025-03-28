import { useState } from 'react'
import { Typography } from '@mui/material'
import { DialogContent, DialogActions, Button } from '@mui/material'
import ModalDialog from '@/components/common/ModalDialog'
import ErrorMessage from '@/components/tx/ErrorMessage'
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

  const handleConfirm = async () => {
    setErrorMessage('')
    trackEvent({ ...SPACE_EVENTS.DECLINE_INVITE_SUBMIT })
    try {
      const { error } = await declineInvite({ spaceId: space.id })

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
      <DialogContent sx={{ p: '24px !important' }}>
        <Typography>
          Are you sure you want to decline the invitation to <b>{space.name}</b>?
        </Typography>
        {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      </DialogContent>

      <DialogActions>
        <Button data-testid="cancel-btn" onClick={onClose}>
          Cancel
        </Button>
        <Button data-testid="decline-btn" onClick={handleConfirm} variant="danger" disableElevation>
          Decline
        </Button>
      </DialogActions>
    </ModalDialog>
  )
}

export default DeclineInviteDialog
