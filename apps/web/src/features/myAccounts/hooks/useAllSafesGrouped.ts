import groupBy from 'lodash/groupBy'
import useAllSafes, { type SafeItem, type SafeItems } from './useAllSafes'
import { useMemo } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'

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

export const useAllSafesGrouped = () => {
  const allSafes = useAllSafes()

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
