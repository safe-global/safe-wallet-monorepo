import { useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import useSafeAddress from '@/hooks/useSafeAddress'
import useChains from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import { useAllSafesGrouped, flattenSafeItems } from '@/hooks/safes/useAllSafesGrouped'
import { useGetMultipleSafeOverviewsQuery } from '@/store/slices'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import type { SafeItemData } from '@/features/spaces/components/SafeSelectorDropdown/types'
import type { ChainInfo } from '@/features/spaces/types'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { AppRoutes } from '@/config/routes'
import { sameAddress } from '@safe-global/utils/utils/addresses'

const buildChainInfo = (
  chainId: string,
  chainMap: Map<string, { chainName: string; chainLogoUri?: string | null }>,
): ChainInfo => {
  const chain = chainMap.get(chainId)
  return {
    chainId,
    chainName: chain?.chainName ?? '',
    chainLogoUri: chain?.chainLogoUri,
  }
}

const findOverview = (overviews: SafeOverview[], chainId: string, address: string): SafeOverview | undefined => {
  return overviews.find((o) => o.chainId === chainId && sameAddress(o.address?.value, address))
}

export function useTopbarSafeData() {
  const router = useRouter()
  const safeAddress = useSafeAddress()
  const { address: walletAddress } = useWallet() ?? {}
  const currency = useAppSelector(selectCurrency)
  const { configs: chains } = useChains()

  const { allMultiChainSafes, allSingleSafes } = useAllSafesGrouped()

  const allSafeItems = useMemo(() => {
    const items = [...(allMultiChainSafes ?? []), ...(allSingleSafes ?? [])]
    return flattenSafeItems(items)
  }, [allMultiChainSafes, allSingleSafes])

  const { data: safeOverviews, isLoading: overviewsLoading } = useGetMultipleSafeOverviewsQuery({
    currency,
    walletAddress,
    safes: allSafeItems,
  })

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
    const result: SafeItemData[] = []
    const overviews = safeOverviews ?? []

    for (const multi of allMultiChainSafes ?? []) {
      const chainInfos = multi.safes.map((s) => buildChainInfo(s.chainId, chainMap))
      const matchingOverviews = overviews.filter((o) => sameAddress(o.address?.value, multi.address))
      const totalBalance = matchingOverviews.reduce((sum, o) => sum + Number(o.fiatTotal), 0)
      const firstOverview = matchingOverviews[0]

      result.push({
        id: multi.address,
        name: multi.name ?? '',
        address: multi.address,
        threshold: firstOverview?.threshold ?? 0,
        owners: firstOverview?.owners?.length ?? 0,
        chains: chainInfos,
        balance: totalBalance.toString(),
        isLoading: overviewsLoading,
      })
    }

    for (const single of allSingleSafes ?? []) {
      const overview = findOverview(overviews, single.chainId, single.address)

      result.push({
        id: single.address,
        name: single.name ?? '',
        address: single.address,
        threshold: overview?.threshold ?? 0,
        owners: overview?.owners?.length ?? 0,
        chains: [buildChainInfo(single.chainId, chainMap)],
        balance: overview?.fiatTotal ?? '0',
        isLoading: overviewsLoading,
      })
    }

    return result
  }, [allMultiChainSafes, allSingleSafes, safeOverviews, overviewsLoading, chainMap])

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
