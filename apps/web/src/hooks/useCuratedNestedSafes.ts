import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { selectCuratedNestedSafes } from '@/store/settingsSlice'
import useSafeAddress from './useSafeAddress'

export interface UseCuratedNestedSafesResult {
  /** Addresses of nested safes selected by user */
  curatedAddresses: string[]
  /** Whether user has completed initial curation for this parent safe */
  hasCompletedCuration: boolean
  /** Timestamp of last curation modification (for detecting new safes) */
  lastModified: number | undefined
}

// Stable empty array reference to prevent infinite re-renders
const EMPTY_ADDRESSES: string[] = []

/**
 * Hook to access curation state for nested safes of the current parent safe.
 * Returns the curated addresses, curation completion status, and last modified timestamp.
 */
export function useCuratedNestedSafes(): UseCuratedNestedSafesResult {
  const parentSafeAddress = useSafeAddress()
  const curationState = useAppSelector((state) => selectCuratedNestedSafes(state, parentSafeAddress))

  // Memoize the result to maintain stable references
  return useMemo(
    () => ({
      curatedAddresses: curationState?.selectedAddresses ?? EMPTY_ADDRESSES,
      hasCompletedCuration: curationState?.hasCompletedCuration ?? false,
      lastModified: curationState?.lastModified,
    }),
    [curationState],
  )
}
