import ModalDialog from '@/components/common/ModalDialog'
import { DialogContent, DialogActions, Button, Typography } from '@mui/material'
import type { UserOrganizationUser } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useUserOrganizationsRemoveUserV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/organizations'
import { useCurrentOrgId } from '@/features/organizations/hooks/useCurrentOrgId'
import { useState } from 'react'

const RemoveMemberDialog = ({ member, handleClose }: { member: UserOrganizationUser; handleClose: () => void }) => {
  const orgId = useCurrentOrgId()
  const [deleteMember] = useUserOrganizationsRemoveUserV1Mutation()
  const [errorMessage, setErrorMessage] = useState<string>('')

  const handleConfirm = async () => {
    setErrorMessage('')
    try {
      const { error } = await deleteMember({ orgId: Number(orgId), userId: member.id })

      if (error) {
        throw error
      }
    } catch (e) {
      setErrorMessage('An unexpected error occurred while removing the member.')
    }
  }

  return (
    <ModalDialog open onClose={handleClose} dialogTitle="Remove member" hideChainIndicator>
      <DialogContent sx={{ p: '24px !important' }}>
        {/* TODO: use name here instead of ID as soon as it's available */}
        <Typography>Are you sure you want to remove {`${member.id}`} from this organization?</Typography>
        {errorMessage && (
          <Typography mt={1} color="error.main">
            {errorMessage}
          </Typography>
        )}
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
