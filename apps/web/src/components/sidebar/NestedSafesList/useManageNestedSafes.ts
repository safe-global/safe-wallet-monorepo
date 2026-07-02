import { useCallback, useState, useMemo, useEffect, useRef } from 'react'
import { getAddress } from 'ethers'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAppDispatch } from '@/store'
import { setCuratedNestedSafes } from '@/store/settingsSlice'
import type { NestedSafeWithStatus } from '@/hooks/useNestedSafesVisibility'
import { useCuratedNestedSafes } from '@/hooks/useCuratedNestedSafes'
import { detectSimilarAddresses, buildSimilarityIndex } from '@safe-global/utils/utils/addressSimilarity'
import type { SimilarityDetectionResult, SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { useListSimilarities } from '@/features/address-poisoning'

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

  const addresses = useMemo(() => allSafesWithStatus.map((safe) => safe.address), [allSafesWithStatus])

  // Legacy intra-list detection (front AND back both match) — kept always-on. Drives the
  // "Similar addresses" group box + confirm dialog for two look-alikes within this list.
  const similarityResult: SimilarityDetectionResult = useMemo(() => detectSimilarAddresses(addresses), [addresses])

  // Anchor detection (front OR back match against a trusted anchor) layered on top. Flag-gated by
  // ADDRESS_POISONING_PROTECTION (empty map when off, so behaviour falls back to intra-list only).
  const anchorAnnotations = useListSimilarities(addresses)
  const anchorMatches = useMemo(() => {
    const byLower = new Map<string, SimilarityMatch>()
    anchorAnnotations.forEach((annotation) => {
      if (annotation.match) byLower.set(annotation.address.toLowerCase(), annotation.match)
    })
    return byLower
  }, [anchorAnnotations])

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

  // A row is flagged if it looks like another entry in this list (intra-list) OR resembles a
  // trusted anchor (anchor). Either one triggers the highlight, the confirm gate and select-all skip.
  const isFlagged = useCallback(
    (address: string) => similarityResult.isFlagged(address) || anchorMatches.has(address.toLowerCase()),
    [similarityResult, anchorMatches],
  )

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

  // Get similar addresses for a flagged address: the intra-list siblings, or — for an anchor
  // match — the trusted anchor the address resembles.
  const getSimilarAddresses = useCallback(
    (address: string): string[] => {
      const group = similarityResult.getGroup(address)
      if (group) return group.addresses.filter((a) => a.toLowerCase() !== address.toLowerCase())

      const anchorMatch = anchorMatches.get(address.toLowerCase())
      if (anchorMatch) return [getAddress('0x' + anchorMatch.anchor)]

      return []
    },
    [similarityResult, anchorMatches],
  )

  // The exact match (real prefix/suffix lengths) to highlight on a row. Covers three cases:
  // the anchor-flagged impostor, an intra-list sibling, and the in-list anchor an impostor resembles
  // (so the trusted look-alike is highlighted for side-by-side comparison too).
  const getSimilarity = useCallback(
    (address: string): SimilarityMatch | undefined => {
      const lower = address.toLowerCase()

      const direct = anchorMatches.get(lower)
      if (direct) return direct

      const group = similarityResult.getGroup(address)
      if (group) {
        const sibling = group.addresses.find((a) => a.toLowerCase() !== lower)
        if (sibling) return buildSimilarityIndex([sibling]).query(address) ?? undefined
      }

      for (const [impostor, match] of anchorMatches) {
        if (match.anchor === lower.slice(2)) return buildSimilarityIndex([impostor]).query(address) ?? undefined
      }

      return undefined
    },
    [similarityResult, anchorMatches],
  )

  const groupedSafes = useMemo(() => {
    const lower = (address: string) => address.toLowerCase()
    const inList = new Map(allSafesWithStatus.map((safe) => [lower(safe.address), safe]))

    // Union-find so any set of mutually or transitively similar safes (A~B, B~C ⇒ {A,B,C}) collapses
    // into ONE group — not disjoint pairs. Edges come from intra-list buckets and anchor matches.
    const parent = new Map<string, string>()
    const ensure = (x: string) => {
      if (!parent.has(x)) parent.set(x, x)
    }
    const find = (x: string): string => {
      let root = x
      while (parent.get(root) !== root) root = parent.get(root) as string
      return root
    }
    const union = (a: string, b: string) => {
      ensure(a)
      ensure(b)
      const rootA = find(a)
      const rootB = find(b)
      if (rootA !== rootB) parent.set(rootA, rootB)
    }
    for (const safe of allSafesWithStatus) ensure(lower(safe.address))

    const flagged = new Set<string>()

    // 1. Intra-list (front AND back): union every safe sharing a bucket.
    const buckets = new Map<string, string[]>()
    for (const safe of allSafesWithStatus) {
      const group = similarityResult.getGroup(safe.address)
      if (!group) continue
      flagged.add(lower(safe.address))
      const members = buckets.get(group.bucketKey) ?? []
      members.push(lower(safe.address))
      buckets.set(group.bucketKey, members)
    }
    for (const members of buckets.values()) {
      for (let i = 1; i < members.length; i++) union(members[0], members[i])
    }

    // 2. Anchor (front OR back): union each impostor with its anchor (when in the list) and with any
    // other impostor resembling the same anchor (so out-of-list anchors still cluster their impostors).
    const byAnchor = new Map<string, string[]>()
    for (const [impostor, match] of anchorMatches) {
      flagged.add(impostor)
      const anchorLower = '0x' + match.anchor
      if (inList.has(anchorLower)) union(impostor, anchorLower)
      const peers = byAnchor.get(match.anchor) ?? []
      peers.push(impostor)
      byAnchor.set(match.anchor, peers)
    }
    for (const peers of byAnchor.values()) {
      for (let i = 1; i < peers.length; i++) union(peers[0], peers[i])
    }

    // Collect connected components in original list order.
    const components = new Map<string, NestedSafeWithStatus[]>()
    for (const safe of allSafesWithStatus) {
      const root = find(lower(safe.address))
      const members = components.get(root) ?? []
      members.push(safe)
      components.set(root, members)
    }

    // A group is critical (red) if any member is a both-ends look-alike: intra-list membership always
    // means front AND back matched, or an anchor match is flagged CRITICAL. Otherwise it's a one-end
    // warning (amber).
    const isCriticalGroup = (safes: NestedSafeWithStatus[]): boolean =>
      safes.some(
        (safe) =>
          similarityResult.isFlagged(safe.address) ||
          anchorMatches.get(lower(safe.address))?.severity === Severity.CRITICAL,
      )

    const groups: { key: string; safes: NestedSafeWithStatus[]; isCritical: boolean }[] = []
    const ungrouped: NestedSafeWithStatus[] = []
    for (const [root, safes] of components) {
      // A component of 2+ is a real similarity cluster; a lone safe is boxed only if it is flagged
      // (an impostor whose anchor isn't in the list).
      if (safes.length >= 2 || flagged.has(lower(safes[0].address))) {
        groups.push({ key: `sim:${root}`, safes, isCritical: isCriticalGroup(safes) })
      } else {
        ungrouped.push(...safes)
      }
    }

    return { groups, ungrouped }
  }, [allSafesWithStatus, similarityResult, anchorMatches])

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
    getSimilarAddresses,
    getSimilarity,
    pendingConfirmation,
    confirmSimilarAddress,
    cancelSimilarAddress,
    // Grouped safes for visual display
    groupedSafes,
  }
}
