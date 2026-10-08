import { useEffect, useRef } from 'react'
import { trackEvent, OVERVIEW_EVENTS } from '@/services/analytics'
import { ATTENTION_PANEL_EVENTS } from '@/services/analytics/events/attention-panel'
import useNonPinnedSafeWarning from '../../hooks/useNonPinnedSafeWarning'
import AddTrustedSafeDialog from './AddTrustedSafeDialog'
import { NonPinnedWarningView } from '@views/features/myAccounts/components/NonPinnedWarning/NonPinnedWarningView'

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
    <NonPinnedWarningView
      onAddClick={() => {
        trackEvent(ATTENTION_PANEL_EVENTS.TRUST_SAFE)
        openConfirmDialog()
      }}
      dialog={
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
      }
    />
  )
}

export default NonPinnedWarning
