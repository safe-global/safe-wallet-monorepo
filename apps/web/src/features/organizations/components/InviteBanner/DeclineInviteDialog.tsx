import { useState } from 'react'
import { Typography } from '@mui/material'
import { DialogContent, DialogActions, Button } from '@mui/material'
import ModalDialog from '@/components/common/ModalDialog'
import ErrorMessage from '@/components/tx/ErrorMessage'
import type { GetOrganizationResponse } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useUserOrganizationsDeclineInviteV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'

type DeclineInviteDialogProps = {
  org: GetOrganizationResponse
  onClose: () => void
}

const DeclineInviteDialog = ({ org, onClose }: DeclineInviteDialogProps) => {
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [declineInvite] = useUserOrganizationsDeclineInviteV1Mutation()

  const handleConfirm = async () => {
    setErrorMessage('')
    try {
      const { error } = await declineInvite({ orgId: org.id })

      if (error) {
        throw error
      }
      onClose()
    } catch (e) {
      setErrorMessage('An unexpected error occurred while declining the invitation.')
    }
  }

  return (
    <ModalDialog open onClose={onClose} dialogTitle="Decline invitation" hideChainIndicator>
      <DialogContent sx={{ p: '24px !important' }}>
        <Typography>
          Are you sure you want to decline the invitation to <b>{org.name}</b>?
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
