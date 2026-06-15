import { type MouseEvent, useState } from 'react'
import { Button, DialogActions, DialogContent, SvgIcon, Tooltip } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import EntryDialog from '@/components/address-book/EntryDialog'
import ModalDialog from '@/components/common/ModalDialog'
import { removeAddressBookEntry } from '@/store/addressBookSlice'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import type { AddressBookEntry } from './SpaceAddressBookTable'

enum ModalType {
  EDIT = 'edit',
  REMOVE = 'remove',
}

const defaultOpen = { [ModalType.EDIT]: false, [ModalType.REMOVE]: false }

const LocalContactActions = ({ entry }: { entry: AddressBookEntry }) => {
  const [open, setOpen] = useState<typeof defaultOpen>(defaultOpen)
  const dispatch = useAppDispatch()

  const handleOpenModal = (e: MouseEvent, type: keyof typeof open) => {
    e.stopPropagation()
    setOpen((prev) => ({ ...prev, [type]: true }))
  }

  const handleCloseModal = () => {
    setOpen(defaultOpen)
  }

  const handleRemove = () => {
    for (const chainId of entry.chainIds) {
      dispatch(removeAddressBookEntry({ chainId, address: entry.address }))
    }
    dispatch(
      showNotification({ message: 'Contact removed', variant: 'success', groupKey: 'remove-local-contact-success' }),
    )
    handleCloseModal()
  }

  return (
    <>
      <Tooltip title="Edit contact" placement="top">
        <IconButton onClick={(e) => handleOpenModal(e, ModalType.EDIT)} size="small">
          <SvgIcon component={EditIcon} inheritViewBox color="border" fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Delete contact" placement="top">
        <IconButton onClick={(e) => handleOpenModal(e, ModalType.REMOVE)} size="small">
          <SvgIcon component={DeleteIcon} inheritViewBox color="error" fontSize="small" />
        </IconButton>
      </Tooltip>

      {open[ModalType.EDIT] && (
        <EntryDialog
          handleClose={handleCloseModal}
          defaultValues={{ name: entry.name, address: entry.address }}
          disableAddressInput
          chainIds={entry.chainIds}
        />
      )}

      {open[ModalType.REMOVE] && (
        <ModalDialog open onClose={handleCloseModal} dialogTitle="Delete contact" hideChainIndicator>
          <DialogContent sx={{ py: 2 }}>
            <p className="text-sm">
              This removes <b>{entry.name}</b> from the address book in this browser on all its networks.
            </p>
          </DialogContent>
          <DialogActions>
            <Button data-testid="cancel-btn" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button data-testid="delete-btn" variant="danger" onClick={handleRemove} disableElevation>
              Delete
            </Button>
          </DialogActions>
        </ModalDialog>
      )}
    </>
  )
}

export default LocalContactActions
