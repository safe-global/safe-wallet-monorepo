import { useState, useMemo, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { addOrUpdateSafe, unpinSafe, selectAllAddedSafes } from '@/store/addedSafesSlice'
import { showNotification } from '@/store/notificationsSlice'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { OVERVIEW_EVENTS, PIN_SAFE_LABELS, trackEvent } from '@/services/analytics'
import { useAllSafesGrouped } from '@/hooks/safes/useAllSafesGrouped'
import useAllSafes from '@/hooks/safes/useAllSafes'
import { useSafesSearch } from '@/hooks/safes/useSafesSearch'
import { useSafeOrderComparator } from '@/hooks/safes'
import { TRUSTED_ORDER_SCOPE } from '@/store/orderByPreferenceSlice'
import { detectSimilarAddresses } from '@safe-global/utils/utils/addressSimilarity'
import type { SelectableSafe, SelectableMultiChainSafe, SelectableItem } from './useTrustedSafesModal.types'
import { isSelectableMultiChainSafe } from './useTrustedSafesModal.types'

// Pinned addresses across all chains, normalized to lowercase
const collectPinnedAddresses = (addedSafes: Record<string, Record<string, unknown>>): Set<string> => {
  const pinnedAddresses = new Set<string>()
  for (const chainSafes of Object.values(addedSafes)) {
    for (const address of Object.keys(chainSafes)) {
      pinnedAddresses.add(address.toLowerCase())
    }
  }
  return pinnedAddresses
}

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
  skipSimilarSelectAll: () => void
  cancelSelectAll: () => void
  submitSelection: () => void
  setSearchQuery: (query: string) => void
}

const useTrustedSafesModal = (): UseTrustedSafesModalReturn => {
  const dispatch = useAppDispatch()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAddresses, setSelectedAddresses] = useState<Set<string>>(new Set())
  const [pendingConfirmation, setPendingConfirmation] = useState<string | null>(null)
  const [pendingSelectAllConfirmation, setPendingSelectAllConfirmation] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const allSafes = useAllSafes()
  const { allMultiChainSafes, allSingleSafes } = useAllSafesGrouped()
  const addedSafes = useAppSelector(selectAllAddedSafes)
  // Same global Name / Last visited / Manual preference used across the trusted-safes lists.
  const sortComparator = useSafeOrderComparator(TRUSTED_ORDER_SCOPE)

  const addresses = useMemo(() => {
    return allSafes?.map((safe) => safe.address) ?? []
  }, [allSafes])

  const similarityResult = useMemo(() => detectSimilarAddresses(addresses), [addresses])

  // Full list without selection state, rebuilt only when the safes, pins, or similarity change.
  const structuralItems = useMemo<SelectableItem[]>(() => {
    if (!allMultiChainSafes || !allSingleSafes) return []

    const items: SelectableItem[] = []

    for (const multiSafe of allMultiChainSafes) {
      const group = similarityResult.getGroup(multiSafe.address)

      const selectableSafes: SelectableSafe[] = multiSafe.safes.map((safe) => ({
        ...safe,
        isPinned: Boolean(addedSafes[safe.chainId]?.[safe.address]),
        isSelected: false,
        similarityGroup: group?.bucketKey,
      }))

      const isPinned = selectableSafes.some((s) => s.isPinned)

      items.push({
        address: multiSafe.address,
        safes: selectableSafes,
        isPinned,
        lastVisited: multiSafe.lastVisited,
        name: multiSafe.name,
        isSelected: false,
        isPartiallySelected: false, // All chains share same selection
        similarityGroup: group?.bucketKey,
      } as SelectableMultiChainSafe)
    }

    for (const safe of allSingleSafes) {
      const group = similarityResult.getGroup(safe.address)
      const isPinned = Boolean(addedSafes[safe.chainId]?.[safe.address])

      items.push({
        ...safe,
        isPinned,
        isSelected: false,
        similarityGroup: group?.bucketKey,
      } as SelectableSafe)
    }

    return items.sort(sortComparator)
  }, [allMultiChainSafes, allSingleSafes, addedSafes, similarityResult, sortComparator])

  // Shared name/address/network search (as on the main list); returns [] for an empty query.
  const searchResults = useSafesSearch(structuralItems, searchQuery)

  // Filter by the search matches, keeping the structural sort order and SelectableItem typing.
  const visibleItems = useMemo<SelectableItem[]>(() => {
    if (!searchQuery) return structuralItems
    const matched = new Set(searchResults.map((item) => item.address.toLowerCase()))
    return structuralItems.filter((item) => matched.has(item.address.toLowerCase()))
  }, [searchQuery, searchResults, structuralItems])

  // Thin overlay injecting selection state over the visible (search-filtered) list
  const availableItems = useMemo<SelectableItem[]>(() => {
    return visibleItems.map((item) => {
      const isSelected = selectedAddresses.has(item.address.toLowerCase())
      if (isSelectableMultiChainSafe(item)) {
        return {
          ...item,
          isSelected,
          safes: item.safes.map((safe) => ({ ...safe, isSelected })),
        }
      }
      return { ...item, isSelected }
    })
  }, [visibleItems, selectedAddresses])

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

  const similarAddressesForSelectAll = useMemo(() => {
    return availableItems.filter((item) => item.similarityGroup)
  }, [availableItems])

  // Addresses of the currently visible (search-filtered) items; selection itself stays full-list
  const visibleAddresses = useMemo(() => {
    return availableItems.map((item) => item.address.toLowerCase())
  }, [availableItems])

  const totalSafesCount = visibleAddresses.length

  const selectedCount = useMemo(() => {
    return visibleAddresses.filter((address) => selectedAddresses.has(address)).length
  }, [visibleAddresses, selectedAddresses])

  const allSelected = totalSafesCount > 0 && selectedCount === totalSafesCount

  const toggleSelection = useCallback(
    (address: string) => {
      const normalizedAddress = address.toLowerCase()
      const isFlagged = similarityResult.isFlagged(address)

      // Functional update so the callback doesn't depend on selectedAddresses
      setSelectedAddresses((prev) => {
        const isCurrentlySelected = prev.has(normalizedAddress)

        // Selecting a flagged address needs explicit confirmation first
        if (!isCurrentlySelected && isFlagged) {
          setPendingConfirmation(normalizedAddress)
          return prev
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

  const confirmSimilarAddress = useCallback(() => {
    if (pendingConfirmation) {
      setSelectedAddresses((prev) => new Set([...prev, pendingConfirmation]))
      setPendingConfirmation(null)
      trackEvent(OVERVIEW_EVENTS.TRUSTED_SAFES_SIMILAR_ADDRESS_CONFIRM)
    }
  }, [pendingConfirmation])

  const cancelSimilarAddress = useCallback(() => {
    setPendingConfirmation(null)
  }, [])

  // Select All acts on the visible (search-filtered) safes. When any are flagged, it defers the
  // whole action to a confirmation dialog without touching the selection, so Cancel is a clean revert.
  const selectAll = useCallback(() => {
    if (similarAddressesForSelectAll.length > 0) {
      setPendingSelectAllConfirmation(true)
      return
    }

    setSelectedAddresses((prev) => new Set([...prev, ...visibleAddresses]))
  }, [similarAddressesForSelectAll, visibleAddresses])

  // "Yes, include them anyway" — select everything visible, similar addresses included
  const confirmSelectAll = useCallback(() => {
    setSelectedAddresses((prev) => new Set([...prev, ...visibleAddresses]))
    setPendingSelectAllConfirmation(false)
    trackEvent({ ...OVERVIEW_EVENTS.TRUSTED_SAFES_SIMILAR_ADDRESS_CONFIRM, label: 'select_all' })
  }, [visibleAddresses])

  // "No, skip similar addresses" — select the visible non-flagged safes, leave the flagged ones out
  const skipSimilarSelectAll = useCallback(() => {
    setSelectedAddresses((prev) => {
      const next = new Set(prev)
      for (const item of availableItems) {
        if (!similarityResult.isFlagged(item.address)) next.add(item.address.toLowerCase())
      }
      return next
    })
    setPendingSelectAllConfirmation(false)
  }, [availableItems, similarityResult])

  // X / overlay dismissal — abort Select All without changing the selection
  const cancelSelectAll = useCallback(() => {
    setPendingSelectAllConfirmation(false)
  }, [])

  // Deselect acts on the visible safes only, leaving selections outside the current filter intact
  const deselectAll = useCallback(() => {
    setSelectedAddresses((prev) => {
      const next = new Set(prev)
      for (const address of visibleAddresses) next.delete(address)
      return next
    })
  }, [visibleAddresses])

  const submitSelection = useCallback(() => {
    if (!allSafes) return

    let pinnedCount = 0
    let unpinnedCount = 0

    // Pin newly selected safes. Only safes present in the current list carry the owner/threshold
    // context we need to store, so pinning is driven by `allSafes`.
    for (const safe of allSafes) {
      const isSelected = selectedAddresses.has(safe.address.toLowerCase())
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
      }
    }

    // Unpin deselected safes by walking the pin store directly (not `allSafes`), so a safe pinned on a
    // chain outside the current config — invisible to the list — is still cleared. Otherwise it would
    // linger in `addedSafes` and keep re-selecting itself on every open.
    for (const [chainId, safesOnChain] of Object.entries(addedSafes)) {
      for (const address of Object.keys(safesOnChain)) {
        if (!selectedAddresses.has(address.toLowerCase())) {
          dispatch(unpinSafe({ chainId, address }))
          unpinnedCount++
        }
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

  // Pre-selects the already-pinned safes so the modal opens reflecting current state
  const open = useCallback(() => {
    setSelectedAddresses(collectPinnedAddresses(addedSafes))
    setIsOpen(true)
    trackEvent(OVERVIEW_EVENTS.OPEN_TRUSTED_SAFES_MODAL)
  }, [addedSafes])

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
    skipSimilarSelectAll,
    cancelSelectAll,
    submitSelection,
    setSearchQuery,
  }
}

export default useTrustedSafesModal
