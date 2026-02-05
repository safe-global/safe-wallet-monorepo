import { useState, useCallback } from 'react'
import { useAppSelector } from '@/store'
import useSafeInfo from '@/hooks/useSafeInfo'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useIsPinnedSafe from '@/hooks/useIsPinnedSafe'
import { useIsWalletProposer } from '@/hooks/useProposers'
import { selectAddressBookByChain } from '@/store/addressBookSlice'
import { useTrustSafe } from './useTrustSafe'
import useSimilarAddressDetection from './useSimilarAddressDetection'
import type { SafeUserRole, NonPinnedWarningState } from './useNonPinnedSafeWarning.types'

/**
 * Hook for managing the non-pinned safe warning state
 *
 * Shows a warning banner when the user is viewing a safe they own
 * or are a proposer for, but haven't added to their pinned list.
 * Includes confirmation dialog with similarity checking.
 */
const useNonPinnedSafeWarning = (): NonPinnedWarningState => {
  const { safe, safeAddress } = useSafeInfo()
  const chainId = safe?.chainId ?? ''
  const isPinnedSafe = useIsPinnedSafe()
  const isOwner = useIsSafeOwner()
  const isProposer = useIsWalletProposer()
  const { trustSafe } = useTrustSafe()
  const { hasSimilarAddress, similarAddresses } = useSimilarAddressDetection(safeAddress)

  // Get safe name from address book
  const addressBook = useAppSelector((state) => selectAddressBookByChain(state, chainId))
  const safeName = safeAddress ? addressBook?.[safeAddress] : undefined

  const [isDismissed, setIsDismissed] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)

  // Determine user role (owner takes priority over proposer)
  const userRole: SafeUserRole = isOwner ? 'owner' : isProposer ? 'proposer' : 'viewer'

  // Show warning if user is owner or proposer but safe is not pinned
  const shouldShowWarning = !isDismissed && !isPinnedSafe && (userRole === 'owner' || userRole === 'proposer')

  // Open confirmation dialog
  const openConfirmDialog = useCallback(() => {
    setIsConfirmDialogOpen(true)
  }, [])

  // Close confirmation dialog
  const closeConfirmDialog = useCallback(() => {
    setIsConfirmDialogOpen(false)
  }, [])

  // Add safe to pinned list (called after confirmation)
  const confirmAndAddToPinnedList = useCallback(async () => {
    if (!chainId || !safeAddress) return

    trustSafe({
      chainId,
      address: safeAddress,
      owners: safe?.owners,
      threshold: safe?.threshold,
    })

    // Close the dialog after adding
    setIsConfirmDialogOpen(false)
  }, [chainId, safeAddress, safe?.owners, safe?.threshold, trustSafe])

  // Dismiss warning for this session
  const dismiss = useCallback(() => {
    setIsDismissed(true)
  }, [])

  return {
    shouldShowWarning,
    safeAddress,
    safeName,
    chainId,
    userRole,
    isDismissed,
    isConfirmDialogOpen,
    hasSimilarAddress,
    similarAddresses,
    openConfirmDialog,
    closeConfirmDialog,
    confirmAndAddToPinnedList,
    dismiss,
  }
}

export default useNonPinnedSafeWarning
