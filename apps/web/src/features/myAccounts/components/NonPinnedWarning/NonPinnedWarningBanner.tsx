import useNonPinnedSafeWarning from '../../hooks/useNonPinnedSafeWarning'
import NonPinnedWarning from './index'

/**
 * Wrapper component that integrates the hook with the NonPinnedWarning UI
 * Used in the Dashboard to show the warning for non-pinned safes
 */
const NonPinnedWarningBanner = () => {
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
    dismiss,
  } = useNonPinnedSafeWarning()

  if (!shouldShowWarning) {
    return null
  }

  return (
    <NonPinnedWarning
      safeAddress={safeAddress}
      safeName={safeName}
      chainId={chainId}
      hasSimilarAddress={hasSimilarAddress}
      similarAddresses={similarAddresses}
      isConfirmDialogOpen={isConfirmDialogOpen}
      onOpenConfirmDialog={openConfirmDialog}
      onCloseConfirmDialog={closeConfirmDialog}
      onConfirmAdd={confirmAndAddToPinnedList}
      onDismiss={dismiss}
    />
  )
}

export default NonPinnedWarningBanner
