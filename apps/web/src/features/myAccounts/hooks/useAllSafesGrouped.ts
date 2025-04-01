import groupBy from 'lodash/groupBy'
import useAllSafes, { type SafeItem, type SafeItems } from './useAllSafes'
import { useMemo } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { type AddressBookState, selectAllAddressBooks } from '@/store/addressBookSlice'
import useWallet from '@/hooks/wallets/useWallet'
import useAllOwnedSafes from '@/features/myAccounts/hooks/useAllOwnedSafes'
import { useAppSelector } from '@/store'
import { isMultiChainSafeItem } from '@/features/multichain/utils/utils'

export type MultiChainSafeItem = {
  address: string
  safes: SafeItem[]
  isPinned: boolean
  lastVisited: number
  name: string | undefined
}

export type AllSafeItemsGrouped = {
  allSingleSafes: SafeItems | undefined
  allMultiChainSafes: MultiChainSafeItem[] | undefined
}

export type AllSafeItems = Array<SafeItem | MultiChainSafeItem>

export const _buildMultiChainSafeItem = (address: string, safes: SafeItems): MultiChainSafeItem => {
  const isPinned = safes.some((safe) => safe.isPinned)
  const lastVisited = safes.reduce((acc, safe) => Math.max(acc, safe.lastVisited || 0), 0)
  const name = safes.find((safe) => safe.name !== undefined)?.name

  return { address, safes, isPinned, lastVisited, name }
}

export function _buildSafeItems(safes: Record<string, string[]>, allSafeNames: AddressBookState): SafeItem[] {
  const result: SafeItem[] = []

  for (const chainId in safes) {
    const addresses = safes[chainId]

    addresses.forEach((address) => {
      const name = allSafeNames[chainId]?.[address]

      result.push({
        chainId,
        address,
        isReadOnly: false,
        isPinned: false,
        lastVisited: 0,
        name,
      })
    })
  }

  return result
}

export function flattenSafeItems(items: Array<SafeItem | MultiChainSafeItem>): SafeItem[] {
  return items.flatMap((item) => (isMultiChainSafeItem(item) ? item.safes : [item]))
}

export const _getMultiChainAccounts = (safes: SafeItems): MultiChainSafeItem[] => {
  const groupedByAddress = groupBy(safes, (safe) => safe.address)

  return Object.entries(groupedByAddress)
    .filter((entry) => entry[1].length > 1)
    .map((entry) => {
      const [address, safes] = entry

      return _buildMultiChainSafeItem(address, safes)
    })
}

export const _getSingleChainAccounts = (safes: SafeItems, allMultiChainSafes: MultiChainSafeItem[]) => {
  return safes.filter((safe) => !allMultiChainSafes.some((multiSafe) => sameAddress(multiSafe.address, safe.address)))
}

export const useAllSafesGrouped = (customSafes?: SafeItems) => {
  const safes = useAllSafes()
  const allSafes = customSafes ?? safes

  return useMemo<AllSafeItemsGrouped>(() => {
    if (!allSafes) {
      return { allMultiChainSafes: undefined, allSingleSafes: undefined }
    }

    const allMultiChainSafes = _getMultiChainAccounts(allSafes)
    const allSingleSafes = _getSingleChainAccounts(allSafes, allMultiChainSafes)

    return {
      allMultiChainSafes,
      allSingleSafes,
    }
  }, [allSafes])
}

export const useOwnedSafesGrouped = () => {
  const { address: walletAddress = '' } = useWallet() || {}
  const [allOwned = {}] = useAllOwnedSafes(walletAddress)
  const allSafeNames = useAppSelector(selectAllAddressBooks)
  const safeItems = _buildSafeItems(allOwned, allSafeNames)

  return useAllSafesGrouped(safeItems)
}
