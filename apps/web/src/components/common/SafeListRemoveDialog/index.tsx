import { Typography } from '@/components/ui/typography'
import type { ReactElement } from 'react'

import ModalDialog from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'
import { useAppDispatch } from '@/store'
import useAddressBook from '@/hooks/useAddressBook'
import { OVERVIEW_EVENTS, OVERVIEW_LABELS, trackEvent } from '@/services/analytics'
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
    trackEvent({ ...OVERVIEW_EVENTS.DELETED_FROM_WATCHLIST, label: trackingLabel })
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

      <DialogActions
        className="p-4 pt-2"
        onCancel={handleClose}
        cancelTestId="cancel-btn"
        confirmLabel="Delete"
        confirmTestId="delete-btn"
        confirmDestructive
        onConfirm={handleConfirm}
      />
    </ModalDialog>
  )
}

export default SafeListRemoveDialog
