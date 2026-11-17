import { useCallback, useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { useSpaceSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { selectCurrency } from '@/store/settingsSlice'
import { selectUndeployedSafes } from '@/store/slices'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useSpaceAddressBookState } from './useGetSpaceAddressBook'
import { SPACE_REFRESH_OPTIONS } from './refreshOptions'

export type SignedSafe = { address: string; name?: string; position: number }
export type WorkspaceSigner = { address: string; chainIds: string[]; safes: SignedSafe[] }
export type SafeOwners = { chainId: string; safeAddress: string; owners: string[] }

export const toWorkspaceSigners = (
  owners: SafeOwners[],
  safeNames: { address: string; name: string }[],
): WorkspaceSigner[] => {
  const names = new Map(safeNames.map(({ address, name }) => [address.toLowerCase(), name]))
  const signers = new Map<string, WorkspaceSigner>()

  for (const { chainId, safeAddress, owners: safeOwners } of owners) {
    safeOwners.forEach((owner, index) => {
      const key = owner.toLowerCase()
      const signer = signers.get(key) ?? { address: owner, chainIds: [], safes: [] }
      signers.set(key, signer)

      if (!signer.chainIds.includes(chainId)) signer.chainIds.push(chainId)

      const position = index + 1
      const known = signer.safes.find((safe) => sameAddress(safe.address, safeAddress))
      if (!known) {
        signer.safes.push({ address: safeAddress, name: names.get(safeAddress.toLowerCase()), position })
      } else if (position < known.position) {
        known.position = position
      }
    })
  }

  return [...signers.values()]
}

export const useWorkspaceSigners = (): {
  signers: WorkspaceSigner[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
} => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const currency = useAppSelector(selectCurrency)
  const undeployedSafes = useAppSelector(selectUndeployedSafes)

  const {
    currentData,
    isLoading: isSafesLoading,
    isError: isSafesError,
    isUninitialized: isSafesUninitialized,
    refetch: refetchSafes,
  } = useSpaceSafesGetV1Query(
    { spaceId: spaceId ?? '' },
    { skip: !isUserSignedIn || !spaceId, ...SPACE_REFRESH_OPTIONS },
  )
  const book = useSpaceAddressBookState()

  const safeRefs = useMemo(
    () =>
      Object.entries(currentData?.safes ?? {}).flatMap(([chainId, addresses]) =>
        addresses.map((address) => ({ chainId, address })),
      ),
    [currentData],
  )

  const hasSafes = safeRefs.length > 0
  const {
    currentData: overviews,
    isError: isOverviewsError,
    refetch: refetchOverviews,
  } = useGetMultipleSafeOverviewsQuery(hasSafes ? { safes: safeRefs, currency } : skipToken)
  // `currentData` is empty while a new set of Safes loads, so signers are never built from the previous set
  const isOverviewsLoading = hasSafes && !overviews && !isOverviewsError

  const { signers, isEveryOverviewMissing } = useMemo(() => {
    let deployedCount = 0
    let missingCount = 0
    const owners = safeRefs.flatMap(({ chainId, address }) => {
      const overview = overviews?.find((item) => item.chainId === chainId && sameAddress(item.address.value, address))
      const [, undeployedSafe] =
        Object.entries(undeployedSafes[chainId] ?? {}).find(([key]) => sameAddress(key, address)) ?? []
      const cfOwners = undeployedSafe?.props.safeAccountConfig.owners
      if (!cfOwners) {
        deployedCount += 1
        if (!overview) missingCount += 1
      }
      const safeOwners = overview ? overview.owners.map((owner) => owner.value) : cfOwners
      return safeOwners ? [{ chainId, safeAddress: address, owners: safeOwners }] : []
    })
    return {
      signers: toWorkspaceSigners(owners, book.items),
      // The overviews endpoint drops Safes it failed to load, so none at all means the request failed
      isEveryOverviewMissing: overviews !== undefined && deployedCount > 0 && missingCount === deployedCount,
    }
  }, [safeRefs, overviews, undeployedSafes, book.items])

  const { refetch: refetchBook, isUninitialized: isBookUninitialized } = book
  const refetch = useCallback(() => {
    if (!isSafesUninitialized) refetchSafes()
    if (!isBookUninitialized) refetchBook()
    if (hasSafes) refetchOverviews()
  }, [isSafesUninitialized, isBookUninitialized, hasSafes, refetchSafes, refetchBook, refetchOverviews])

  return {
    signers,
    isLoading: isSafesLoading || isOverviewsLoading || book.isLoading,
    isError: isSafesError || isOverviewsError || isEveryOverviewMissing || book.isError,
    refetch,
  }
}
