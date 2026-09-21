import { useEffect, useRef } from 'react'
import { Alert, AlertTitle, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { trackEvent, OVERVIEW_EVENTS } from '@/services/analytics'
import { ATTENTION_PANEL_EVENTS } from '@/services/analytics/events/attention-panel'
import useNonPinnedSafeWarning from '../../hooks/useNonPinnedSafeWarning'
import AddTrustedSafeDialog from './AddTrustedSafeDialog'

/**
 * Warning card displayed when user is viewing a non-pinned safe they own
 * Uses ActionCard component for consistent UI across all dashboard warnings
 * Provides option to trust the safe with confirmation dialog
 */
const NonPinnedWarning = () => {
  const {
    shouldShowWarning,
    safeAddress,
    safeName,
    chainId,
    hasSimilarAddress,
    similarAddresses,
    isConfirmDialogOpen,
    openConfirmDialog,
    closeConfirmDialog,
    confirmAndAddToPinnedList,
  } = useNonPinnedSafeWarning()

  // Track when warning is shown (once per render)
  const hasTrackedWarning = useRef(false)
  useEffect(() => {
    if (shouldShowWarning && !hasTrackedWarning.current) {
      trackEvent(OVERVIEW_EVENTS.TRUSTED_SAFES_WARNING_SHOW)
      hasTrackedWarning.current = true
    }
  }, [shouldShowWarning])

  if (!shouldShowWarning) {
    return null
  }

  return (
    <>
      <Alert variant="warning" outlined={false} data-testid="non-pinned-warning">
        <AlertSeverityIcon variant="warning" />
        <AlertTitle className="font-bold">Not in your accounts</AlertTitle>
        <AlertDescription>
          You&apos;re a signer of this Safe, but you haven&apos;t added it to your accounts yet. Adding it helps you
          recognize it and reduces the risk of impersonation.
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="text-foreground"
              data-testid="trust-this-safe-button"
              onClick={() => {
                trackEvent(ATTENTION_PANEL_EVENTS.TRUST_SAFE)
                openConfirmDialog()
              }}
            >
              Add to my accounts
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <AddTrustedSafeDialog
        open={isConfirmDialogOpen}
        safeAddress={safeAddress}
        safeName={safeName}
        chainId={chainId}
        hasSimilarAddress={hasSimilarAddress}
        similarAddresses={similarAddresses}
        onConfirm={confirmAndAddToPinnedList}
        onCancel={closeConfirmDialog}
      />
    </>
  )
}

export default NonPinnedWarning
