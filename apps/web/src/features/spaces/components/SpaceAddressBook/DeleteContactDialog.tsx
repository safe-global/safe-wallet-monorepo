import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import DialogTitle from '@mui/material/DialogTitle'
import ModalDialog from '@/components/common/ModalDialog'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { ChainIndicatorList } from '@/features/multichain/components/SignerSetupWarning/InconsistentSignerSetupWarning'
import { useAddressBooksDeleteByAddressV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import { useState } from 'react'
import { Alert, CircularProgress } from '@mui/material'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'

type DeleteContactDialogProps = {
  name: string
  address: string
  networks: string[]
  onClose: () => void
}

const DeleteContactDialog = ({ name, address, networks, onClose }: DeleteContactDialogProps) => {
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dispatch = useAppDispatch()
  const spaceId = useCurrentSpaceId()
  const [deleteEntry] = useAddressBooksDeleteByAddressV1Mutation()

  const handleConfirm = async () => {
    setError(undefined)

    try {
      setIsSubmitting(true)
      trackEvent({ ...SPACE_EVENTS.REMOVE_ADDRESS_SUBMIT })
      const response = await deleteEntry({ spaceId: Number(spaceId), address })

      if (response.error) {
        setError('Something went wrong deleting the contact. Please try again.')
        return
      }

      dispatch(
        showNotification({
          message: `Deleted contact`,
          variant: 'success',
          groupKey: 'delete-contact-success',
        }),
      )

      onClose()
    } catch (error) {
      setError('Something went wrong deleting the contact. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ModalDialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Remove address book entry</DialogTitle>

      <DialogContent sx={{ p: '24px !important' }}>
        <Typography mb={1}>
          Are you sure you want to remove <strong>{name}</strong> from the address book? This change will apply to the
          following networks:
        </Typography>

        <ChainIndicatorList chainIds={networks} />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          data-testid="delete-btn"
          onClick={handleConfirm}
          variant="danger"
          disableElevation
          disabled={isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={20} /> : 'Remove'}
        </Button>
      </DialogActions>
    </ModalDialog>
  )
}

export default DeleteContactDialog
