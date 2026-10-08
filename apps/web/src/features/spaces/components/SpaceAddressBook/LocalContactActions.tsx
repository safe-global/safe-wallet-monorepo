import { type MouseEvent, useState } from 'react'
import EntryDialog from '@/components/address-book/EntryDialog'
import { removeAddressBookEntry } from '@/store/addressBookSlice'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import type { AddressBookEntry } from './SpaceAddressBookTable'
import { LocalContactActionsView } from '@views/features/spaces/components/SpaceAddressBook/LocalContactActionsView'

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
    <LocalContactActionsView
      name={entry.name}
      onEdit={(e) => handleOpenModal(e, ModalType.EDIT)}
      onRemove={(e) => handleOpenModal(e, ModalType.REMOVE)}
      isRemoveOpen={open[ModalType.REMOVE]}
      onCloseModal={handleCloseModal}
      onConfirmRemove={handleRemove}
      editDialog={
        open[ModalType.EDIT] && (
          <EntryDialog
            handleClose={handleCloseModal}
            defaultValues={{ name: entry.name, address: entry.address }}
            disableAddressInput
            chainIds={entry.chainIds}
          />
        )
      }
    />
  )
}

export default LocalContactActions
