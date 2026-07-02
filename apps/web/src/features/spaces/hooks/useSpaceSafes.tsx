import { useSpaceSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { _buildSafeItems, type AllSafeItems, useAllSafesGrouped, useAllOwnedSafes, getComparator } from '@/hooks/safes'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import useGetSpaceAddressBook from './useGetSpaceAddressBook'
import { SPACE_REFRESH_OPTIONS } from './refreshOptions'
import { mapSpaceContactsToAddressBookState } from '../utils'
import { useAppSelector } from '@/store'
import { selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { selectAllAddressBooks, selectAllVisitedSafes } from '@/store/slices'
import merge from 'lodash/merge'
import { useMemo } from 'react'
import { isAuthenticated } from '@/store/authSlice'
import useWallet from '@/hooks/wallets/useWallet'

export const useSpaceSafes = () => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const {
    currentData,
    isLoading,
    isError: isSpaceSafesError,
    error: spaceSafesError,
    refetch: refetchSpaceSafes,
  } = useSpaceSafesGetV1Query(
    { spaceId: spaceId ?? '' },
    { skip: !isUserSignedIn || !spaceId, ...SPACE_REFRESH_OPTIONS },
  )
  const spaceContacts = useGetSpaceAddressBook()
  const localAddressBook = useAppSelector(selectAllAddressBooks)

  // Space contacts take priority but fall back to the user's address book, so the name used for
  // sorting matches the name actually displayed (the row resolves via the address book too — see
  // useSafeDisplayName). Without the fallback, address-book-named safes have an empty `name` here
  // and "Name" sorting silently no-ops on them.
  const addressBooks = useMemo(
    () => merge({}, localAddressBook, mapSpaceContactsToAddressBookState(spaceContacts)),
    [localAddressBook, spaceContacts],
  )

  const { address: walletAddress = '' } = useWallet() || {}
  const [allOwned = {}] = useAllOwnedSafes(walletAddress)
  const allVisitedSafes = useAppSelector(selectAllVisitedSafes)
  const safeItems = currentData ? _buildSafeItems(currentData.safes, addressBooks, allOwned, allVisitedSafes) : []
  const safes = useAllSafesGrouped(safeItems)
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = getComparator(orderBy)

  const allSafes = useMemo<AllSafeItems>(
    () => [...(safes.allMultiChainSafes ?? []), ...(safes.allSingleSafes ?? [])].sort(sortComparator),
    [safes.allMultiChainSafes, safes.allSingleSafes, sortComparator],
  )

  return { allSafes, isLoading, isError: isSpaceSafesError, error: spaceSafesError, refetch: refetchSpaceSafes }
}

/**
 * Fetches the safes of an explicit space (not the current one) with optional
 * `skip`, so callers can lazy-load a space's safes on demand — e.g. the welcome
 * Workspaces accordion, where each space row loads its safes only when expanded.
 *
 * Unlike {@link useSpaceSafes} this resolves names from the local address book
 * only (no per-space contacts fetch), keeping the lazy list lightweight.
 */
export const useSpaceSafesById = (spaceId: string, { skip = false }: { skip?: boolean } = {}) => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData, isLoading, isError, error, refetch } = useSpaceSafesGetV1Query(
    { spaceId },
    { skip: skip || !isUserSignedIn || !spaceId, ...SPACE_REFRESH_OPTIONS },
  )

  const localAddressBook = useAppSelector(selectAllAddressBooks)
  const { address: walletAddress = '' } = useWallet() || {}
  const [allOwned = {}] = useAllOwnedSafes(walletAddress)
  const allVisitedSafes = useAppSelector(selectAllVisitedSafes)
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const sortComparator = getComparator(orderBy)

  const safeItems = currentData ? _buildSafeItems(currentData.safes, localAddressBook, allOwned, allVisitedSafes) : []
  const grouped = useAllSafesGrouped(safeItems)

  const allSafes = useMemo<AllSafeItems>(
    () => [...(grouped.allMultiChainSafes ?? []), ...(grouped.allSingleSafes ?? [])].sort(sortComparator),
    [grouped.allMultiChainSafes, grouped.allSingleSafes, sortComparator],
  )

  return { allSafes, isLoading, isError, error, refetch }
}
