import { type MouseEvent, useState } from 'react'
import EditIcon from '@/public/images/common/edit.svg'
import DeleteIcon from '@/public/images/common/delete.svg'
import EntryDialog from '@/components/address-book/EntryDialog'
import ModalDialog from '@/components/common/ModalDialog'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
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
      <Tooltip>
        <TooltipTrigger
          render={
            <Button type="button" variant="ghost" size="icon-sm" onClick={(e) => handleOpenModal(e, ModalType.EDIT)} />
          }
        >
          <EditIcon className="size-4 text-[var(--color-border-main)]" />
        </TooltipTrigger>
        <TooltipContent>Edit contact</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={(e) => handleOpenModal(e, ModalType.REMOVE)}
            />
          }
        >
          <DeleteIcon className="size-4 text-[var(--color-error-main)]" />
        </TooltipTrigger>
        <TooltipContent>Delete contact</TooltipContent>
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
          <div className="px-6 py-4">
            <Typography variant="paragraph-small">
              This removes <b>{entry.name}</b> from the address book in this browser on all its networks.
            </Typography>
          </div>
          <DialogFooter className="px-6 pt-0 pb-6 sm:flex-row sm:justify-end">
            <Button data-testid="cancel-btn" type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button data-testid="delete-btn" type="button" variant="destructive" onClick={handleRemove}>
              Delete
            </Button>
          </DialogFooter>
        </ModalDialog>
      )}
    </>
  )
}

export default LocalContactActions
