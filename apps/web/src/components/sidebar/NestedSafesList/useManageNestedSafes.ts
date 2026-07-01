import { useCallback, useState, useMemo, useEffect, useRef } from 'react'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAppDispatch } from '@/store'
import { setCuratedNestedSafes } from '@/store/settingsSlice'
import type { NestedSafeWithStatus } from '@/hooks/useNestedSafesVisibility'
import { useCuratedNestedSafes } from '@/hooks/useCuratedNestedSafes'
import { useSelectionSimilarities, type SelectionSimilarity } from '@/features/address-poisoning'

const toggleAddress = (prev: Set<string>, normalizedAddress: string): Set<string> => {
  const next = new Set(prev)
  if (next.has(normalizedAddress)) {
    next.delete(normalizedAddress)
  } else {
    next.add(normalizedAddress)
  }
  return next
}

/**
 * Manages the toggle/save/cancel logic for nested safes curation in manage mode.
 * Uses a Set to track selected addresses for curating.
 */
export const useManageNestedSafes = (allSafesWithStatus: NestedSafeWithStatus[]) => {
  const dispatch = useAppDispatch()
  const parentSafeAddress = useSafeAddress()
  const { curatedAddresses, hasCompletedCuration } = useCuratedNestedSafes()

  // Track previous curated addresses to detect removals on save
  const previousCuratedRef = useRef<Set<string>>(new Set(curatedAddresses.map((a) => a.toLowerCase())))

  // Track selected addresses as a Set for O(1) lookups
  const [selectedAddresses, setSelectedAddresses] = useState<Set<string>>(() => {
    return new Set(curatedAddresses.map((addr) => addr.toLowerCase()))
  })

  // Track pending confirmation for flagged address selection
  const [pendingConfirmation, setPendingConfirmation] = useState<string | null>(null)

  // Combined anchor + intra-list similarity detection over the nested-safe addresses.
  // Memoize the address array so the hook's Map stays referentially stable.
  const addresses = useMemo(() => allSafesWithStatus.map((safe) => safe.address), [allSafesWithStatus])
  const similarities = useSelectionSimilarities(addresses)

  // Reset selection when curatedAddresses changes (e.g., on safe switch)
  useEffect(() => {
    const normalized = new Set(curatedAddresses.map((addr) => addr.toLowerCase()))
    setSelectedAddresses(normalized)
    previousCuratedRef.current = normalized
  }, [curatedAddresses])

  // Check if a safe is currently selected
  const isSafeSelected = useCallback(
    (address: string): boolean => {
      return selectedAddresses.has(address.toLowerCase())
    },
    [selectedAddresses],
  )

  // Get the combined similarity result for a given address
  const getSimilarity = useCallback(
    (address: string): SelectionSimilarity | undefined => similarities.get(address),
    [similarities],
  )

  // A row is "flagged" iff it resembles a trusted anchor or another list entry
  const isFlagged = useCallback((address: string) => !!similarities.get(address)?.match, [similarities])

  // Toggle a safe's selection state
  // Requires confirmation for flagged addresses (potential address poisoning)
  const toggleSafe = useCallback(
    (address: string) => {
      const normalizedAddress = address.toLowerCase()

      if (!selectedAddresses.has(normalizedAddress) && isFlagged(address)) {
        setPendingConfirmation(normalizedAddress)
        return
      }

      setSelectedAddresses((prev) => toggleAddress(prev, normalizedAddress))
    },
    [isFlagged, selectedAddresses],
  )

  // Select all safes (excludes flagged addresses - they must be selected individually)
  const selectAll = useCallback(() => {
    const nonFlaggedAddresses = allSafesWithStatus
      .filter((safe) => !isFlagged(safe.address))
      .map((safe) => safe.address.toLowerCase())
    setSelectedAddresses(new Set(nonFlaggedAddresses))
  }, [allSafesWithStatus, isFlagged])

  // Deselect all safes
  const deselectAll = useCallback(() => {
    setSelectedAddresses(new Set())
  }, [])

  // Confirm selection of a flagged address (after user acknowledges similarity warning)
  const confirmSimilarAddress = useCallback(() => {
    if (pendingConfirmation) {
      setSelectedAddresses((prev) => new Set([...prev, pendingConfirmation]))
      setPendingConfirmation(null)
    }
  }, [pendingConfirmation])

  // Cancel selection of a flagged address
  const cancelSimilarAddress = useCallback(() => {
    setPendingConfirmation(null)
  }, [])

  // Cancel changes and reset to current curation state
  const cancel = useCallback(() => {
    setSelectedAddresses(new Set(curatedAddresses.map((addr) => addr.toLowerCase())))
  }, [curatedAddresses])

  // Save curation - dispatches setCuratedNestedSafes with hasCompletedCuration: true
  // Trust is determined by useIsTrustedSafe which checks both addedSafes and curated nested safes
  const saveChanges = useCallback(() => {
    const selectedList = Array.from(selectedAddresses)

    dispatch(
      setCuratedNestedSafes({
        parentSafeAddress,
        selectedAddresses: selectedList,
        hasCompletedCuration: true,
      }),
    )

    // Update previous curated ref for next save comparison
    previousCuratedRef.current = new Set(selectedList)
  }, [selectedAddresses, parentSafeAddress, dispatch])

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (selectedAddresses.size !== curatedAddresses.length) return true
    return !curatedAddresses.every((addr) => selectedAddresses.has(addr.toLowerCase()))
  }, [selectedAddresses, curatedAddresses])

  // Count of selected safes
  const selectedCount = selectedAddresses.size

  // Check if all safes are selected
  const allSelected = selectedCount === allSafesWithStatus.length && allSafesWithStatus.length > 0

  return {
    toggleSafe,
    isSafeSelected,
    saveChanges,
    cancel,
    selectAll,
    deselectAll,
    selectedCount,
    hasChanges,
    allSelected,
    hasCompletedCuration,
    // Similarity detection
    isFlagged,
    getSimilarity,
    pendingConfirmation,
    confirmSimilarAddress,
    cancelSimilarAddress,
  }
}
