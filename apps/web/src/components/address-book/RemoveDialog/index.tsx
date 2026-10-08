import type { ReactElement } from 'react'

import { useAppDispatch } from '@/store'
import { removeAddressBookEntry } from '@/store/addressBookSlice'
import useChainId from '@/hooks/useChainId'
import useAddressBook from '@/hooks/useAddressBook'
import { RemoveDialogView } from '@views/components/address-book/RemoveDialog/RemoveDialogView'

const RemoveDialog = ({ handleClose, address }: { handleClose: () => void; address: string }): ReactElement => {
  const dispatch = useAppDispatch()
  const chainId = useChainId()
  const addressBook = useAddressBook()

  const name = addressBook?.[address]

  const handleConfirm = () => {
    dispatch(removeAddressBookEntry({ chainId, address, notify: true }))
    handleClose()
  }

  return <RemoveDialogView name={name} onClose={handleClose} onConfirm={handleConfirm} />
}

export default RemoveDialog
