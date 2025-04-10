import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import DialogTitle from '@mui/material/DialogTitle'
import ModalDialog from '@/components/common/ModalDialog'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { ChainIndicatorList } from '@/features/multichain/components/SignerSetupWarning/InconsistentSignerSetupWarning'

type RemoveAddressBookEntryDialogProps = {
  name: string
  address: string
  networks: {
    chainId: string
    name: string
    id: string
  }[]
  onClose: () => void
}

const RemoveAddressBookEntryDialog = ({ name, address, networks, onClose }: RemoveAddressBookEntryDialogProps) => {
  const handleConfirm = async () => {
    try {
      // TODO: Implement the API call to remove the address book entry
      //   await Promise.all(entryIds.map((id) => removeAddressBookEntry(id)))
      console.log('remove address book entries', name, address, networks)
      trackEvent({ ...SPACE_EVENTS.REMOVE_ADDRESS_SUBMIT })
      onClose()
    } catch (error) {
      console.error('Failed to remove address book entry', error)
    }
  }

  return (
    <ModalDialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Remove address book entry</DialogTitle>

      <DialogContent sx={{ p: '24px !important' }}>
        <Typography>
          Are you sure you want to remove <strong>{name}</strong> from the address book? This change will apply to the
          following networks:
        </Typography>
        <ChainIndicatorList chainIds={networks.map(({ chainId }) => chainId)} />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button data-testid="delete-btn" onClick={handleConfirm} variant="danger" disableElevation>
          Remove
        </Button>
      </DialogActions>
    </ModalDialog>
  )
}

export default RemoveAddressBookEntryDialog
