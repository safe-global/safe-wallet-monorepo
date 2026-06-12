import { useState, useMemo, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { addOrUpdateSafe, unpinSafe, selectAllAddedSafes } from '@/store/addedSafesSlice'
import { showNotification } from '@/store/notificationsSlice'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { OVERVIEW_EVENTS, PIN_SAFE_LABELS, trackEvent } from '@/services/analytics'
import { useAllSafesGrouped } from '@/hooks/safes/useAllSafesGrouped'
import useAllSafes from '@/hooks/safes/useAllSafes'
import { detectSimilarAddresses } from '@safe-global/utils/utils/addressSimilarity'
import type { SelectableSafe, SelectableMultiChainSafe, SelectableItem } from './useTrustedSafesModal.types'

/**
 * Collect all pinned addresses from addedSafes state (normalized to lowercase)
 */
const collectPinnedAddresses = (addedSafes: Record<string, Record<string, unknown>>): Set<string> => {
  const pinnedAddresses = new Set<string>()
  for (const chainSafes of Object.values(addedSafes)) {
    for (const address of Object.keys(chainSafes)) {
      pinnedAddresses.add(address.toLowerCase())
    }
  }
  return pinnedAddresses
}

/**
 * Build the notification payload based on pin/unpin counts
 */
const getSubmitNotification = (
  pinnedCount: number,
  unpinnedCount: number,
): { title: string; message: string } | null => {
  if (pinnedCount > 0 && unpinnedCount > 0) {
    return {
      title: 'Trusted Safes updated',
      message: `${pinnedCount} Safe${pinnedCount !== 1 ? 's' : ''} added, ${unpinnedCount} Safe${unpinnedCount !== 1 ? 's' : ''} removed`,
    }
  }
  if (pinnedCount > 0) {
    return {
      title: pinnedCount === 1 ? 'Safe confirmed' : `${pinnedCount} Safes confirmed`,
      message: 'Trusted Safe(s) added to your list',
    }
  }
  if (unpinnedCount > 0) {
    return {
      title: unpinnedCount === 1 ? 'Safe removed' : `${unpinnedCount} Safes removed`,
      message: 'Safes have been removed from your Trusted Safes list',
    }
  }
  return null
}

export interface UseTrustedSafesModalReturn {
  /** Whether the modal is currently open */
  isOpen: boolean
  /** List of safes available for selection with their status (includes both single and multichain) */
  availableItems: SelectableItem[]
  /** Set of currently selected addresses */
  selectedAddresses: Set<string>
  /** Address awaiting similarity confirmation (null if none) */
  pendingConfirmation: string | null
  /** Whether user is being asked to confirm selecting all with similar addresses */
  pendingSelectAllConfirmation: boolean
  /** Addresses flagged as similar that would be selected by "Select All" */
  similarAddressesForSelectAll: SelectableItem[]
  /** Current search query */
  searchQuery: string
  /** Whether safes are loading */
  isLoading: boolean
  /** Whether there are any changes to submit */
  hasChanges: boolean
  /** Number of currently visible (search-filtered) safes */
  totalSafesCount: number
  /** Number of visible safes currently selected */
  selectedCount: number
  /** Whether all visible safes are selected */
  allSelected: boolean

  // Actions
  open: () => void
  close: () => void
  toggleSelection: (address: string) => void
  selectAll: () => void
  deselectAll: () => void
  confirmSimilarAddress: () => void
  cancelSimilarAddress: () => void
  confirmSelectAll: () => void
  cancelSelectAll: () => void
  submitSelection: () => void
  setSearchQuery: (query: string) => void
}

/**
 * Hook for managing the safe selection modal state
 *
 * Handles:
 * - Opening/closing modal
 * - Selecting/deselecting safes
 * - Similarity detection and confirmation flow
 * - Submitting selection to pin safes
 */
const useTrustedSafesModal = (): UseTrustedSafesModalReturn => {
  const dispatch = useAppDispatch()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAddresses, setSelectedAddresses] = useState<Set<string>>(new Set())
  const [pendingConfirmation, setPendingConfirmation] = useState<string | null>(null)
  const [pendingSelectAllConfirmation, setPendingSelectAllConfirmation] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Get all safes user can access (flat list for submit logic)
  const allSafes = useAllSafes()
  // Get safes grouped by address (for display)
  const { allMultiChainSafes, allSingleSafes } = useAllSafesGrouped()
  const addedSafes = useAppSelector(selectAllAddedSafes)

  // Get addresses for similarity detection
  const addresses = useMemo(() => {
    return allSafes?.map((safe) => safe.address) ?? []
  }, [allSafes])

  // Run similarity detection - flags all addresses that look similar to each other
  const similarityResult = useMemo(() => detectSimilarAddresses(addresses), [addresses])

  // Build selectable items list (multichain groups + single safes)
  const availableItems = useMemo<SelectableItem[]>(() => {
    if (!allMultiChainSafes || !allSingleSafes) return []

    const items: SelectableItem[] = []

    // Helper to check if address matches search
    const matchesSearch = (address: string, name?: string): boolean => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return address.toLowerCase().includes(query) || (name ? name.toLowerCase().includes(query) : false)
    }

    // Add multichain safes (grouped by address)
    for (const multiSafe of allMultiChainSafes) {
      if (!matchesSearch(multiSafe.address, multiSafe.name)) continue

      const group = similarityResult.getGroup(multiSafe.address)
      const normalizedAddress = multiSafe.address.toLowerCase()
      const isSelected = selectedAddresses.has(normalizedAddress)

      // Build child safes with selection state
      const selectableSafes: SelectableSafe[] = multiSafe.safes.map((safe) => ({
        ...safe,
        isPinned: Boolean(addedSafes[safe.chainId]?.[safe.address]),
        isSelected,
        similarityGroup: group?.bucketKey,
      }))

      // Check if any child is pinned
      const isPinned = selectableSafes.some((s) => s.isPinned)

      items.push({
        address: multiSafe.address,
        safes: selectableSafes,
        isPinned,
        lastVisited: multiSafe.lastVisited,
        name: multiSafe.name,
        isSelected,
        isPartiallySelected: false, // All chains share same selection
        similarityGroup: group?.bucketKey,
      } as SelectableMultiChainSafe)
    }

    // Add single-chain safes
    for (const safe of allSingleSafes) {
      if (!matchesSearch(safe.address, safe.name)) continue

      const group = similarityResult.getGroup(safe.address)
      const isPinned = Boolean(addedSafes[safe.chainId]?.[safe.address])

      items.push({
        ...safe,
        isPinned,
        isSelected: selectedAddresses.has(safe.address.toLowerCase()),
        similarityGroup: group?.bucketKey,
      } as SelectableSafe)
    }

    return items
  }, [allMultiChainSafes, allSingleSafes, addedSafes, similarityResult, selectedAddresses, searchQuery])

  // Check if there are any changes to submit (pins or unpins) across the full list,
  // not just the search-filtered view — selection persists across searches, so Save
  // must reflect pending changes for safes hidden by the current query.
  const hasChanges = useMemo(() => {
    if (!allSafes) return false
    return allSafes.some((safe) => {
      const isSelected = selectedAddresses.has(safe.address.toLowerCase())
      const isPinned = Boolean(addedSafes[safe.chainId]?.[safe.address])
      return (isSelected && !isPinned) || (!isSelected && isPinned)
    })
  }, [allSafes, selectedAddresses, addedSafes])

  // Get items with similarity warnings that would be selected by "Select All"
  const similarAddressesForSelectAll = useMemo(() => {
    return availableItems.filter((item) => item.similarityGroup)
  }, [availableItems])

  // Addresses of the currently visible (search-filtered) items, normalized to lowercase
  const visibleAddresses = useMemo(() => {
    return availableItems.map((item) => item.address.toLowerCase())
  }, [availableItems])

  // Number of currently visible (search-filtered) safes, for counter display
  const totalSafesCount = visibleAddresses.length

  // Number of visible safes that are currently selected
  const selectedCount = useMemo(() => {
    return visibleAddresses.filter((address) => selectedAddresses.has(address)).length
  }, [visibleAddresses, selectedAddresses])

  // All visible safes are selected
  const allSelected = totalSafesCount > 0 && selectedCount === totalSafesCount

  // Toggle selection for an address
  // Uses functional state update to check current selection state without dependency on selectedAddresses
  const toggleSelection = useCallback(
    (address: string) => {
      const normalizedAddress = address.toLowerCase()
      const isFlagged = similarityResult.isFlagged(address)

      // Use functional update to read current state without adding dependency
      setSelectedAddresses((prev) => {
        const isCurrentlySelected = prev.has(normalizedAddress)

        // If trying to select a flagged address, require confirmation
        if (!isCurrentlySelected && isFlagged) {
          setPendingConfirmation(normalizedAddress)
          return prev // No change yet
        }

        const next = new Set(prev)
        if (isCurrentlySelected) {
          next.delete(normalizedAddress)
        } else {
          next.add(normalizedAddress)
        }
        return next
      })
    },
    [similarityResult],
  )

  // Confirm selection of a similar address
  const confirmSimilarAddress = useCallback(() => {
    if (pendingConfirmation) {
      setSelectedAddresses((prev) => new Set([...prev, pendingConfirmation]))
      setPendingConfirmation(null)
      trackEvent(OVERVIEW_EVENTS.TRUSTED_SAFES_SIMILAR_ADDRESS_CONFIRM)
    }
  }, [pendingConfirmation])

  // Cancel selection of a similar address
  const cancelSimilarAddress = useCallback(() => {
    setPendingConfirmation(null)
  }, [])

  // Select all currently visible (search-filtered) safes
  // (prompts for confirmation if any visible item has a similarity warning)
  const selectAll = useCallback(() => {
    // Check if there are any similar addresses that would be selected
    if (similarAddressesForSelectAll.length > 0) {
      // First add only the visible non-similar addresses to the current selection
      setSelectedAddresses((prev) => {
        const next = new Set(prev)
        for (const item of availableItems) {
          if (!similarityResult.isFlagged(item.address)) next.add(item.address.toLowerCase())
        }
        return next
      })
      // Then show confirmation dialog for similar addresses
      setPendingSelectAllConfirmation(true)
      return
    }

    // No similar addresses, select all visible directly
    setSelectedAddresses((prev) => new Set([...prev, ...visibleAddresses]))
  }, [availableItems, similarAddressesForSelectAll, similarityResult, visibleAddresses])

  // Confirm selecting all visible safes including similar addresses
  const confirmSelectAll = useCallback(() => {
    setSelectedAddresses((prev) => new Set([...prev, ...visibleAddresses]))
    setPendingSelectAllConfirmation(false)
    trackEvent({ ...OVERVIEW_EVENTS.TRUSTED_SAFES_SIMILAR_ADDRESS_CONFIRM, label: 'select_all' })
  }, [visibleAddresses])

  // Cancel selecting similar addresses (keeps only non-similar selected)
  const cancelSelectAll = useCallback(() => {
    setPendingSelectAllConfirmation(false)
  }, [])

  // Deselect all currently visible (search-filtered) safes
  const deselectAll = useCallback(() => {
    setSelectedAddresses((prev) => {
      const next = new Set(prev)
      for (const address of visibleAddresses) next.delete(address)
      return next
    })
  }, [visibleAddresses])

  // Submit the selection to pin/unpin safes
  const submitSelection = useCallback(() => {
    if (!allSafes) return

    let pinnedCount = 0
    let unpinnedCount = 0

    for (const safe of allSafes) {
      const normalizedAddress = safe.address.toLowerCase()
      const isSelected = selectedAddresses.has(normalizedAddress)
      const isPinned = Boolean(addedSafes[safe.chainId]?.[safe.address])

      if (isSelected && !isPinned) {
        dispatch(
          addOrUpdateSafe({
            safe: {
              ...defaultSafeInfo,
              chainId: safe.chainId,
              address: { value: safe.address },
              owners: defaultSafeInfo.owners,
              threshold: defaultSafeInfo.threshold,
            },
          }),
        )
        pinnedCount++
      } else if (!isSelected && isPinned) {
        dispatch(unpinSafe({ chainId: safe.chainId, address: safe.address }))
        unpinnedCount++
      }
    }

    const notification = getSubmitNotification(pinnedCount, unpinnedCount)
    if (notification) {
      dispatch(showNotification({ ...notification, groupKey: 'pin-safes-batch-success', variant: 'success' }))
    }

    // PIN_SAFE event only fires when exclusively pinning or unpinning (not both)
    if (pinnedCount > 0 && unpinnedCount === 0) {
      trackEvent({ ...OVERVIEW_EVENTS.PIN_SAFE, label: PIN_SAFE_LABELS.pin })
    }
    if (unpinnedCount > 0 && pinnedCount === 0) {
      trackEvent({ ...OVERVIEW_EVENTS.PIN_SAFE, label: PIN_SAFE_LABELS.unpin })
    }
    if (pinnedCount > 0) {
      trackEvent({ ...OVERVIEW_EVENTS.TRUSTED_SAFES_ADDED, label: pinnedCount })
    }
    if (unpinnedCount > 0) {
      trackEvent({ ...OVERVIEW_EVENTS.TRUSTED_SAFES_REMOVED, label: unpinnedCount })
    }

    setIsOpen(false)
    setSelectedAddresses(new Set())
    setSearchQuery('')
  }, [allSafes, selectedAddresses, addedSafes, dispatch])

  // Open modal - pre-selects only already pinned safes
  const open = useCallback(() => {
    setSelectedAddresses(collectPinnedAddresses(addedSafes))
    setIsOpen(true)
    trackEvent(OVERVIEW_EVENTS.OPEN_TRUSTED_SAFES_MODAL)
  }, [addedSafes])

  // Close modal and reset state
  const close = useCallback(() => {
    setIsOpen(false)
    setPendingConfirmation(null)
    setPendingSelectAllConfirmation(false)
    setSearchQuery('')
  }, [])

  return {
    isOpen,
    availableItems,
    selectedAddresses,
    pendingConfirmation,
    pendingSelectAllConfirmation,
    similarAddressesForSelectAll,
    searchQuery,
    isLoading: !allSafes || !allMultiChainSafes || !allSingleSafes,
    hasChanges,
    totalSafesCount,
    selectedCount,
    allSelected,
    open,
    close,
    toggleSelection,
    selectAll,
    deselectAll,
    confirmSimilarAddress,
    cancelSimilarAddress,
    confirmSelectAll,
    cancelSelectAll,
    submitSelection,
    setSearchQuery,
  }
}

export default useTrustedSafesModal
