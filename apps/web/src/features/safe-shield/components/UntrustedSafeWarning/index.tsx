import { useState, type ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import type { SafeAnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import { SeverityIcon } from '../SeverityIcon'
import { AddTrustedSafeDialog, useSimilarAddressDetection } from '@/features/myAccounts'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectAddressBookByChain } from '@/store/addressBookSlice'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { OVERVIEW_EVENTS, TRUSTED_SAFE_LABELS, trackEvent } from '@/services/analytics'

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
    <>
      <div data-testid="untrusted-safe-warning" className="p-3">
        <div className="rounded-[4px] bg-[var(--color-background-main)] p-4">
          <div className="flex flex-row items-start gap-2">
            <SeverityIcon severity={safeAnalysis.severity} />
            <div className="flex flex-1 flex-col gap-2">
              <Typography variant="paragraph-small-medium" className="text-[var(--color-primary-light)]">
                {safeAnalysis.title}
              </Typography>
              <Typography variant="paragraph-small" className="text-[var(--color-text-secondary)]">
                {safeAnalysis.description}
              </Typography>
              <Button variant="outline" size="sm" onClick={handleOpenConfirmDialog} className="mt-2 self-start">
                Trust this Safe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {safeAddress && (
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
      )}
    </>
  )
}

export default UntrustedSafeWarning
