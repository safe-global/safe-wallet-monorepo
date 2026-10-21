import ModalDialog from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'
import { Typography } from '@safe-global/views/components/ui/typography'
import { removeAddressBookEntry } from '@/store/addressBookSlice'
import { showNotification } from '@/store/notificationsSlice'
import useAllAddressBooks from '@/hooks/useAllAddressBooks'
import { useAppDispatch } from '@/store'
import { storedKeysOf } from './utils'

type DeleteLocalContactDialogProps = {
  name: string
  address: string
  onClose: () => void
}

const DeleteLocalContactDialog = ({ name, address, onClose }: DeleteLocalContactDialogProps) => {
  const dispatch = useAppDispatch()
  const localBooks = useAllAddressBooks()

  const handleDelete = () => {
    for (const key of storedKeysOf(localBooks, address)) {
      dispatch(removeAddressBookEntry(key))
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
