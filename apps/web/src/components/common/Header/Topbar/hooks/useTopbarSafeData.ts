import { useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import { skipToken } from '@reduxjs/toolkit/query'
import useSafeAddress from '@/hooks/useSafeAddress'
import useChainId from '@/hooks/useChainId'
import useChains from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import useBalances from '@/hooks/useBalances'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useSpaceSafes } from '@/features/spaces'
import { isMultiChainSafeItem, flattenSafeItems } from '@/hooks/safes/useAllSafesGrouped'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import type { SafeItemData } from '@/features/spaces/components/SafeSelectorDropdown/types'
import type { ChainInfo } from '@/features/spaces/types'
import { AppRoutes } from '@/config/routes'
import { sameAddress } from '@safe-global/utils/utils/addresses'

/**
This part is still under development
Todo: finsh and fix the logc
 */
const buildChainInfo = (
  chainId: string,
  chainMap: Map<string, { chainName: string; chainLogoUri?: string | null; shortName: string }>,
): ChainInfo => {
  const chain = chainMap.get(chainId)
  return {
    chainId,
    chainName: chain?.chainName ?? '',
    chainLogoUri: chain?.chainLogoUri,
  }
}

export function useTopbarSafeData() {
  const router = useRouter()
  const safeAddress = useSafeAddress()
  const currentChainId = useChainId()
  const { safe, safeLoaded } = useSafeInfo()
  const { balances } = useBalances()
  const { address: walletAddress } = useWallet() ?? {}
  const currency = useAppSelector(selectCurrency)
  const { configs: chains } = useChains()

  // Get all safes belonging to the current space
  const { allSafes: spaceSafes } = useSpaceSafes()

  // Flatten for the overview query
  const flatSafeItems = useMemo(() => flattenSafeItems(spaceSafes ?? []), [spaceSafes])

  const { data: safeOverviews, isLoading: overviewsLoading } = useGetMultipleSafeOverviewsQuery(
    flatSafeItems.length > 0 ? { safes: flatSafeItems, currency, walletAddress } : skipToken,
  )

  const chainMap = useMemo(() => {
    const map = new Map<string, { chainName: string; chainLogoUri?: string | null; shortName: string }>()
    for (const chain of chains) {
      map.set(chain.chainId, {
        chainName: chain.chainName,
        chainLogoUri: chain.chainLogoUri,
        shortName: chain.shortName,
      })
    }
    return map
  }, [chains])

  const items = useMemo<SafeItemData[]>(() => {
    if (!spaceSafes || spaceSafes.length === 0) return []

    const result: SafeItemData[] = []
    const overviews = safeOverviews ?? []

    for (const safeItem of spaceSafes) {
      if (isMultiChainSafeItem(safeItem)) {
        // Multi-chain safe: aggregate data from all chains
        const chainInfos = safeItem.safes.map((s) => buildChainInfo(s.chainId, chainMap))
        const matchingOverviews = overviews.filter((o) => sameAddress(o.address?.value, safeItem.address))
        const totalBalance = matchingOverviews.reduce((sum, o) => sum + Number(o.fiatTotal), 0)
        const firstOverview = matchingOverviews[0]

        // For the current safe, use live data from useSafeInfo + useBalances
        const isCurrentSafe = sameAddress(safeItem.address, safeAddress)
        const threshold = isCurrentSafe && safeLoaded ? safe.threshold : (firstOverview?.threshold ?? 0)
        const owners = isCurrentSafe && safeLoaded ? safe.owners.length : (firstOverview?.owners?.length ?? 0)
        const balance = isCurrentSafe ? balances.fiatTotal : totalBalance.toString()

        result.push({
          id: safeItem.address,
          name: safeItem.name ?? '',
          address: safeItem.address,
          threshold,
          owners,
          chains: chainInfos,
          balance,
          isLoading: isCurrentSafe ? false : overviewsLoading,
        })
      } else {
        // Single-chain safe
        const overview = overviews.find(
          (o) => o.chainId === safeItem.chainId && sameAddress(o.address?.value, safeItem.address),
        )

        const isCurrentSafe = sameAddress(safeItem.address, safeAddress) && safeItem.chainId === currentChainId
        const threshold = isCurrentSafe && safeLoaded ? safe.threshold : (overview?.threshold ?? 0)
        const owners = isCurrentSafe && safeLoaded ? safe.owners.length : (overview?.owners?.length ?? 0)
        const balance = isCurrentSafe ? balances.fiatTotal : (overview?.fiatTotal ?? '0')

        result.push({
          id: safeItem.address,
          name: safeItem.name ?? '',
          address: safeItem.address,
          threshold,
          owners,
          chains: [buildChainInfo(safeItem.chainId, chainMap)],
          balance,
          isLoading: isCurrentSafe ? false : overviewsLoading,
        })
      }
    }

    return result
  }, [spaceSafes, safeOverviews, overviewsLoading, chainMap, safeAddress, currentChainId, safe, safeLoaded, balances])

  const selectedItemId = safeAddress || undefined

  const handleItemSelect = useCallback(
    (itemId: string) => {
      const item = items.find((i) => sameAddress(i.address, itemId))
      if (!item) return

      const firstChain = item.chains[0]
      if (!firstChain) return

      const chainInfo = chainMap.get(firstChain.chainId)
      if (!chainInfo) return

      router.push({
        pathname: AppRoutes.home,
        query: { safe: `${chainInfo.shortName}:${item.address}` },
      })
    },
    [items, chainMap, router],
  )

  const handleChainChange = useCallback(
    (chainId: string) => {
      if (!safeAddress) return

      const chainInfo = chainMap.get(chainId)
      if (!chainInfo) return

      router.push({
        pathname: router.pathname,
        query: { ...router.query, safe: `${chainInfo.shortName}:${safeAddress}` },
      })
    },
    [safeAddress, chainMap, router],
  )

  return {
    items,
    selectedItemId,
    handleItemSelect,
    handleChainChange,
  }
}
