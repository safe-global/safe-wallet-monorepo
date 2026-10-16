import ModalDialog from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'
import { Typography } from '@safe-global/views/components/ui/typography'
import { removeAddressBookEntry } from '@/store/addressBookSlice'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'

type DeleteLocalContactDialogProps = {
  name: string
  address: string
  chainIds: string[]
  onClose: () => void
}

const DeleteLocalContactDialog = ({ name, address, chainIds, onClose }: DeleteLocalContactDialogProps) => {
  const dispatch = useAppDispatch()

  const handleDelete = () => {
    for (const chainId of chainIds) {
      dispatch(removeAddressBookEntry({ chainId, address }))
    }
    dispatch(
      showNotification({ message: 'Contact removed', variant: 'success', groupKey: 'remove-local-contact-success' }),
    )
    onClose()
  }

  return (
    <ModalDialog open onClose={onClose} dialogTitle="Delete contact" hideChainIndicator>
      <div className="px-6 py-4">
        <Typography variant="paragraph-small">
          This removes <b>{name}</b> from the address book in this browser on all its networks.
        </Typography>
      </div>
      <DialogActions
        className="px-6 pt-0 pb-6"
        onCancel={onClose}
        cancelTestId="cancel-btn"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        confirmDestructive
        confirmTestId="delete-btn"
      />
    </ModalDialog>
  )
}

export default DeleteLocalContactDialog
