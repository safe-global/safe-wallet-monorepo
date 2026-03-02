import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import type { ReactElement } from 'react'

import ModalDialog from '@/components/common/ModalDialog'
import { useAppDispatch, useAppSelector } from '@/store'
import { removeAddressBookEntry } from '@/store/addressBookSlice'
import { removeCustomAbi, selectCustomAbisByChain } from '@/store/customAbiSlice'
import useChainId from '@/hooks/useChainId'
import useAddressBook from '@/hooks/useAddressBook'
import { trackEvent } from '@/services/analytics'
import { SETTINGS_EVENTS } from '@/services/analytics/events/settings'

const RemoveDialog = ({ handleClose, address }: { handleClose: () => void; address: string }): ReactElement => {
  const dispatch = useAppDispatch()
  const chainId = useChainId()
  const addressBook = useAddressBook()
  const customAbis = useAppSelector((state) => selectCustomAbisByChain(state, chainId))

  const name = addressBook?.[address]
  const hasCustomAbi = !!customAbis[address]

  const handleConfirm = () => {
    dispatch(removeAddressBookEntry({ chainId, address }))
    dispatch(removeCustomAbi({ chainId, address }))
    if (hasCustomAbi) {
      trackEvent(SETTINGS_EVENTS.CUSTOM_ABIS.REMOVE)
    }
    handleClose()
  }

  return (
    <ModalDialog open onClose={handleClose} dialogTitle="Delete entry">
      <DialogContent sx={{ p: '24px !important' }}>
        <Typography>
          Are you sure you want to permanently delete <b>{name}</b> from your address book?
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="danger" disableElevation>
          Delete
        </Button>
      </DialogActions>
    </ModalDialog>
  )
}

export default RemoveDialog
