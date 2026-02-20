import { useState, useCallback } from 'react'
import { useAppSelector } from '@/store'
import useSafeInfo from '@/hooks/useSafeInfo'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useIsTrustedSafe from '@/hooks/useIsTrustedSafe'
import { useIsWalletProposer } from '@/hooks/useProposers'
import { selectAddressBookByChain } from '@/store/addressBookSlice'
import { OVERVIEW_EVENTS, TRUSTED_SAFE_LABELS, trackEvent } from '@/services/analytics'
import { useTrustSafe } from './useTrustSafe'
import useSimilarAddressDetection from './useSimilarAddressDetection'
import type { SafeUserRole, NonPinnedWarningState } from './useNonPinnedSafeWarning.types'

/**
 * Hook for managing the non-pinned safe warning state
 *
 * Shows a warning banner when the user is viewing a safe they own
 * or are a proposer for, but haven't added to their trusted list.
 * A safe is trusted if it's pinned OR curated as a nested safe.
 * Includes confirmation dialog with similarity checking.
 */
const useNonPinnedSafeWarning = (): NonPinnedWarningState => {
  const { safe, safeAddress } = useSafeInfo()
  const chainId = safe?.chainId ?? ''
  const isTrustedSafe = useIsTrustedSafe()
  const isOwner = useIsSafeOwner()
  const isProposer = useIsWalletProposer()
  const { trustSafe } = useTrustSafe()
  const { hasSimilarAddress, similarAddresses } = useSimilarAddressDetection(safeAddress)

  // Get safe name from address book
  const addressBook = useAppSelector((state) => selectAddressBookByChain(state, chainId))
  const safeName = safeAddress ? addressBook?.[safeAddress] : undefined

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)

  // Determine user role (owner takes priority over proposer)
  const userRole: SafeUserRole = isOwner ? 'owner' : isProposer ? 'proposer' : 'viewer'

  // Show warning if user is owner or proposer but safe is not trusted
  const shouldShowWarning = !isTrustedSafe && (userRole === 'owner' || userRole === 'proposer')

  // Open confirmation dialog
  const openConfirmDialog = useCallback(() => {
    setIsConfirmDialogOpen(true)
    trackEvent({ ...OVERVIEW_EVENTS.TRUSTED_SAFES_ADD_SINGLE, label: TRUSTED_SAFE_LABELS.non_pinned_warning })
  }, [])

  // Close confirmation dialog
  const closeConfirmDialog = useCallback(() => {
    setIsConfirmDialogOpen(false)
  }, [])

  // Add safe to pinned list (called after confirmation)
  const confirmAndAddToPinnedList = useCallback(
    (name: string) => {
      if (!chainId || !safeAddress) return

      trustSafe({
        chainId,
        address: safeAddress,
        name: name || undefined,
        owners: safe?.owners,
        threshold: safe?.threshold,
      })

      trackEvent({
        ...OVERVIEW_EVENTS.TRUSTED_SAFES_ADD_SINGLE_CONFIRM,
        label: hasSimilarAddress ? TRUSTED_SAFE_LABELS.with_similarity : TRUSTED_SAFE_LABELS.without_similarity,
      })

      // Close the dialog after adding
      setIsConfirmDialogOpen(false)
    },
    [chainId, safeAddress, safe?.owners, safe?.threshold, trustSafe, hasSimilarAddress],
  )

  return {
    shouldShowWarning,
    safeAddress,
    safeName,
    chainId,
    userRole,
    isConfirmDialogOpen,
    hasSimilarAddress,
    similarAddresses,
    openConfirmDialog,
    closeConfirmDialog,
    confirmAndAddToPinnedList,
  }
}

export default useNonPinnedSafeWarning
