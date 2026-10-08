import { useState, type ReactElement } from 'react'
import type { SafeAnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import { AddTrustedSafeDialog, useSimilarAddressDetection } from '@/features/myAccounts'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectAddressBookByChain } from '@/store/addressBookSlice'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { OVERVIEW_EVENTS, TRUSTED_SAFE_LABELS, trackEvent } from '@/services/analytics'
import { UntrustedSafeWarningView } from '@views/features/safe-shield/components/UntrustedSafeWarning/UntrustedSafeWarningView'

type UntrustedSafeWarningProps = {
  safeAnalysis: SafeAnalysisResult
  onAddToTrustedList: () => void
}

/**
 * Warning component displayed when the current Safe is not in the user's trusted list.
 * Shows the warning message and provides a button to add the Safe to the trusted list
 * with a confirmation dialog.
 */
const UntrustedSafeWarning = ({ safeAnalysis, onAddToTrustedList }: UntrustedSafeWarningProps): ReactElement => {
  const dispatch = useAppDispatch()
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const { safe, safeAddress } = useSafeInfo()
  const chainId = safe?.chainId ?? ''
  const addressBook = useAppSelector((state) => selectAddressBookByChain(state, chainId))
  const safeName = safeAddress ? addressBook?.[safeAddress] : undefined
  const { hasSimilarAddress, similarAddresses } = useSimilarAddressDetection(safeAddress)

  const handleOpenConfirmDialog = () => {
    setIsConfirmDialogOpen(true)
    trackEvent({ ...OVERVIEW_EVENTS.TRUSTED_SAFES_ADD_SINGLE, label: TRUSTED_SAFE_LABELS.safe_shield })
  }
  const handleCloseConfirmDialog = () => setIsConfirmDialogOpen(false)
  const handleConfirmAddToTrustedList = (name: string) => {
    const canUpdateAddressBook = name && safeAddress && chainId
    if (canUpdateAddressBook) {
      dispatch(upsertAddressBookEntries({ chainIds: [chainId], address: safeAddress, name: name.trim() }))
    }
    onAddToTrustedList()
    setIsConfirmDialogOpen(false)
  }

  return (
    <UntrustedSafeWarningView
      severity={safeAnalysis.severity}
      title={safeAnalysis.title}
      description={safeAnalysis.description}
      onAddClick={handleOpenConfirmDialog}
      dialog={
        safeAddress && (
          <AddTrustedSafeDialog
            open={isConfirmDialogOpen}
            safeAddress={safeAddress}
            safeName={safeName}
            chainId={chainId}
            hasSimilarAddress={hasSimilarAddress}
            similarAddresses={similarAddresses}
            onConfirm={handleConfirmAddToTrustedList}
            onCancel={handleCloseConfirmDialog}
          />
        )
      }
    />
  )
}

export default UntrustedSafeWarning
