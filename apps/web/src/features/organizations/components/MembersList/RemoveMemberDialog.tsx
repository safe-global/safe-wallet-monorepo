import ModalDialog from '@/components/common/ModalDialog'
import { DialogContent, DialogActions, Button, Typography } from '@mui/material'
import { useUserOrganizationsRemoveUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useCurrentOrgId } from '@/features/organizations/hooks/useCurrentOrgId'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { useState } from 'react'

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
  const orgId = useCurrentOrgId()
  const [deleteMember] = useUserOrganizationsRemoveUserV1Mutation()
  const [errorMessage, setErrorMessage] = useState<string>('')

  const handleConfirm = async () => {
    setErrorMessage('')
    try {
      const { error } = await deleteMember({ orgId: Number(orgId), userId })

      if (error) {
        throw error
      }
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
      <DialogContent sx={{ p: '24px !important' }}>
        <Typography>
          {isInvite ? `Are you sure you want to remove the invitation for ` : `Are you sure you want to remove `}
          <b>{memberName}</b>
          {isInvite ? `` : ` from this organization?`}
        </Typography>
        {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      </DialogContent>

      <DialogActions>
        <Button data-testid="cancel-btn" onClick={handleClose}>
          Cancel
        </Button>
        <Button data-testid="delete-btn" onClick={handleConfirm} variant="danger" disableElevation>
          Remove
        </Button>
      </DialogActions>
    </ModalDialog>
  )
}

export default RemoveMemberDialog
