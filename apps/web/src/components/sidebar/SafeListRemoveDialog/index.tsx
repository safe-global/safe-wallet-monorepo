import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import type { ReactElement } from 'react'

import ModalDialog from '@/components/common/ModalDialog'
import { useAppDispatch } from '@/store'
import useAddressBook from '@/hooks/useAddressBook'
import Track from '@/components/common/Track'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS } from '@/services/analytics'
import { AppRoutes } from '@/config/routes'
import router from 'next/router'
import { removeAddressBookEntry } from '@/store/addressBookSlice'
import { removeSafe, removeUndeployedSafe } from '@/store/slices'
import useSafeAddress from '@/hooks/useSafeAddress'
import useChainId from '@/hooks/useChainId'

const SafeListRemoveDialog = ({
  handleClose,
  address,
  chainId,
}: {
  handleClose: () => void
  address: string
  chainId: string
}): ReactElement => {
  const dispatch = useAppDispatch()
  const safeAddress = useSafeAddress()
  const safeChainId = useChainId()
  const addressBook = useAddressBook()
  const trackingLabel =
    router.pathname === AppRoutes.welcome.accounts ? OVERVIEW_LABELS.login_page : OVERVIEW_LABELS.sidebar

  const safe = addressBook?.[address] || address

  const handleConfirm = async () => {
    // When removing the current counterfactual safe, redirect to the accounts page
    if (safeAddress === address && safeChainId === chainId) {
      await router.push(AppRoutes.welcome.accounts)
    }
    dispatch(removeUndeployedSafe({ chainId, address }))
    dispatch(removeSafe({ chainId, address }))
    dispatch(removeAddressBookEntry({ chainId, address }))
    handleClose()
  }

  return (
    <ModalDialog open onClose={handleClose} dialogTitle="Delete entry" chainId={chainId}>
      <div className="p-6">
        <Typography>
          Are you sure you want to remove the <b>{safe}</b> account?
        </Typography>
      </div>

      <div className="flex justify-end gap-2 p-4 pt-2">
        <Button variant="ghost" data-testid="cancel-btn" onClick={handleClose}>
          Cancel
        </Button>
        <Track {...OVERVIEW_EVENTS.DELETED_FROM_WATCHLIST} label={trackingLabel}>
          <Button data-testid="delete-btn" onClick={handleConfirm} variant="destructive">
            Delete
          </Button>
        </Track>
      </div>
    </ModalDialog>
  )
}

export default SafeListRemoveDialog
