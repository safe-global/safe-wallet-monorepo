import type { ReactElement } from 'react'

import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import ModalDialog from '@/components/common/ModalDialog'
import { useAppDispatch } from '@/store'
import { removeAddressBookEntry } from '@/store/addressBookSlice'
import useChainId from '@/hooks/useChainId'
import useAddressBook from '@/hooks/useAddressBook'

const RemoveDialog = ({ handleClose, address }: { handleClose: () => void; address: string }): ReactElement => {
  const dispatch = useAppDispatch()
  const chainId = useChainId()
  const addressBook = useAddressBook()

  const name = addressBook?.[address]

  const handleConfirm = () => {
    dispatch(removeAddressBookEntry({ chainId, address }))
    handleClose()
  }

  return (
    <ModalDialog open onClose={handleClose} dialogTitle="Delete entry">
      <div className="p-6">
        <Typography>
          Are you sure you want to permanently delete <b>{name}</b> from your address book?
        </Typography>
      </div>

      <div className="flex items-center justify-end gap-2 p-2">
        <Button variant="ghost" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} variant="destructive">
          Delete
        </Button>
      </div>
    </ModalDialog>
  )
}

export default RemoveDialog
