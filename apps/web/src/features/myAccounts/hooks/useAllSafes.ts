import type { AllOwnedSafes } from '@safe-global/safe-gateway-typescript-sdk'
import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import type { AddedSafesState } from '@/store/addedSafesSlice'
import { selectAllAddedSafes } from '@/store/addedSafesSlice'
import useChains from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import type { AddressBookState, UndeployedSafesState, VisitedSafesState } from '@/store/slices'
import { selectAllAddressBooks, selectAllVisitedSafes, selectUndeployedSafes } from '@/store/slices'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import useAllOwnedSafes from './useAllOwnedSafes'

export type SafeItem = {
  chainId: string
  address: string
  isReadOnly: boolean
  isPinned: boolean
  lastVisited: number
  name: string | undefined
}

export type SafeItems = SafeItem[]

export const _prepareAddresses = (
  chainId: string,
  allAdded: AddedSafesState,
  allOwned: AllOwnedSafes,
  allUndeployed: UndeployedSafesState,
): string[] => {
  const addedOnChain = Object.keys(allAdded[chainId] || {})
  const ownedOnChain = allOwned[chainId] || []
  const undeployedOnChain = Object.keys(allUndeployed[chainId] || {})

  const combined = [...addedOnChain, ...ownedOnChain, ...undeployedOnChain]

  // We need to sort to prevent potential jumps when pinning safes
  return [...new Set(combined)].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
}

export const _buildSafeItem = (
  chainId: string,
  address: string,
  walletAddress: string,
  allAdded: AddedSafesState,
  allOwned: AllOwnedSafes,
  allUndeployed: UndeployedSafesState,
  allVisitedSafes: VisitedSafesState,
  allSafeNames: AddressBookState,
): SafeItem => {
  const addedSafe = allAdded[chainId]?.[address]
  const isPinned = Boolean(addedSafe) // Pinning a safe means adding it to the added safes storage
  const undeployedSafeOwners = allUndeployed[chainId]?.[address]?.props.safeAccountConfig.owners || []

  // Determine if the user is an owner
  const isOwnerFromCF = undeployedSafeOwners.some((ownedAddress) => sameAddress(walletAddress, ownedAddress))
  const isOwnedSafe = (allOwned[chainId] || []).includes(address)
  const isOwned = isOwnedSafe || isOwnerFromCF

  const lastVisited = allVisitedSafes[chainId]?.[address]?.lastVisited || 0
  const name = allSafeNames[chainId]?.[address]

  return {
    chainId,
    address,
    isReadOnly: !isOwned,
    isPinned,
    lastVisited,
    name,
  }
}

const useAllSafes = (): SafeItems | undefined => {
  const { address: walletAddress = '' } = useWallet() || {}
  const [allOwned = {}] = useAllOwnedSafes(walletAddress)
  const { configs } = useChains()
  const allAdded = useAppSelector(selectAllAddedSafes)
  const allUndeployed = useAppSelector(selectUndeployedSafes)
  const allVisitedSafes = useAppSelector(selectAllVisitedSafes)
  const allSafeNames = useAppSelector(selectAllAddressBooks)

  return useMemo<SafeItems>(() => {
    const allChainIds = configs.map((config) => config.chainId)

    return allChainIds.flatMap((chainId) => {
      const uniqueAddresses = _prepareAddresses(chainId, allAdded, allOwned, allUndeployed)

      return uniqueAddresses.map((address) => {
        return _buildSafeItem(
          chainId,
          address,
          walletAddress,
          allAdded,
          allOwned,
          allUndeployed,
          allVisitedSafes,
          allSafeNames,
        )
      })
    })
  }, [allAdded, allOwned, allUndeployed, configs, walletAddress, allVisitedSafes, allSafeNames])
}

export default useAllSafes
