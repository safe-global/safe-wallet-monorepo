import { useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useSpaceSafes } from '@/features/spaces'
import { isMultiChainSafeItem, flattenSafeItems } from '@/hooks/safes'
import type { SafeItem, MultiChainSafeItem } from '@/hooks/safes'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChainId from '@/hooks/useChainId'
import useChains from '@/hooks/useChains'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import useWallet from '@/hooks/wallets/useWallet'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { skipToken } from '@reduxjs/toolkit/query'
import { AppRoutes } from '@/config/routes'
import type { SafeItemData } from '@/features/spaces/components/SafeSelectorDropdown/types'
import type { ChainInfo } from '@/features/spaces/types'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

const toChainInfo = (chainId: string, chain: Chain | undefined): ChainInfo => ({
  chainId,
  chainName: chain?.chainName ?? chainId,
  chainLogoUri: chain?.chainLogoUri ?? null,
  shortName: chain?.shortName ?? chainId,
})

const sumFiatTotals = (overviews: SafeOverview[]): number =>
  overviews.reduce((sum, o) => {
    const fiat = parseFloat(o.fiatTotal || '0')
    return isNaN(fiat) ? sum : sum + fiat
  }, 0)

const resolveThresholdAndOwners = (
  isCurrentSafe: boolean,
  safe: { threshold: number; owners?: { value: string }[] },
  overview: SafeOverview | undefined,
) => ({
  threshold: isCurrentSafe ? safe.threshold : (overview?.threshold ?? 0),
  owners: isCurrentSafe ? (safe.owners?.length ?? 0) : (overview?.owners.length ?? 0),
})

const mapChainIds = (chainConfigs: Chain[], chainIds: string[]): ChainInfo[] =>
  chainIds.map((id) =>
    toChainInfo(
      id,
      chainConfigs.find((c) => c.chainId === id),
    ),
  )

function buildMultiChainItem(
  item: MultiChainSafeItem,
  isCurrentSafe: boolean,
  currentChainId: string,
  overviews: SafeOverview[] | undefined,
  overviewsLoading: boolean,
  safe: { threshold: number; owners?: { value: string }[] },
  chainConfigs: Chain[],
): SafeItemData {
  const chainIds = item.safes.map((s) => s.chainId)
  const orderedChainIds = isCurrentSafe ? [currentChainId, ...chainIds.filter((id) => id !== currentChainId)] : chainIds

  const safeOverviews =
    overviews?.filter(
      (o) => sameAddress(o.address.value, item.address) && item.safes.some((s) => s.chainId === o.chainId),
    ) ?? []
  const firstOverview = safeOverviews[0] as SafeOverview | undefined

  return {
    id: `${orderedChainIds[0]}:${item.address}`,
    name: item.name ?? '',
    address: item.address,
    ...resolveThresholdAndOwners(isCurrentSafe, safe, firstOverview),
    balance: sumFiatTotals(safeOverviews).toString(),
    isLoading: overviewsLoading && safeOverviews.length === 0,
    chains: mapChainIds(chainConfigs, orderedChainIds),
  }
}

function buildSingleChainItem(
  item: SafeItem,
  isCurrentSafe: boolean,
  overviews: SafeOverview[] | undefined,
  overviewsLoading: boolean,
  safe: { threshold: number; owners?: { value: string }[] },
  chainConfigs: Chain[],
): SafeItemData {
  const overview = overviews?.find((o) => sameAddress(o.address.value, item.address) && o.chainId === item.chainId)

  return {
    id: `${item.chainId}:${item.address}`,
    name: item.name ?? '',
    address: item.address,
    ...resolveThresholdAndOwners(isCurrentSafe, safe, overview),
    balance: overview?.fiatTotal ?? '0',
    isLoading: overviewsLoading && !overview,
    chains: mapChainIds(chainConfigs, [item.chainId]),
  }
}

export function useSpaceSafeSelectorItems() {
  const { allSafes } = useSpaceSafes()
  const { safe, safeAddress } = useSafeInfo()
  const currentChainId = useChainId()
  const { configs: chainConfigs } = useChains()
  const router = useRouter()
  const currency = useAppSelector(selectCurrency)
  const { address: walletAddress } = useWallet() || {}

  const flatSafes = useMemo(() => flattenSafeItems(allSafes), [allSafes])

  const {
    data: overviews,
    isLoading: overviewsLoading,
    isError: overviewsError,
    refetch: refetchOverviews,
  } = useGetMultipleSafeOverviewsQuery(flatSafes.length > 0 ? { safes: flatSafes, currency, walletAddress } : skipToken)

  const items: SafeItemData[] = useMemo(() => {
    return allSafes.map((item) => {
      const isCurrentSafe = item.address.toLowerCase() === safeAddress.toLowerCase()

      if (isMultiChainSafeItem(item)) {
        return buildMultiChainItem(item, isCurrentSafe, currentChainId, overviews, overviewsLoading, safe, chainConfigs)
      }

      return buildSingleChainItem(item, isCurrentSafe, overviews, overviewsLoading, safe, chainConfigs)
    })
  }, [allSafes, safeAddress, currentChainId, safe, overviews, overviewsLoading, chainConfigs])

  const selectedItemId = `${currentChainId}:${safeAddress}`

  const handleItemSelect = useCallback(
    (itemId: string) => {
      const colonIndex = itemId.indexOf(':')
      const chainId = itemId.slice(0, colonIndex)
      const address = itemId.slice(colonIndex + 1)
      const chain = chainConfigs.find((c) => c.chainId === chainId)
      if (!chain) return
      router.push({ pathname: AppRoutes.home, query: { safe: `${chain.shortName}:${address}` } })
    },
    [chainConfigs, router],
  )

  return {
    items,
    selectedItemId,
    handleItemSelect,
    isError: overviewsError,
    refetch: refetchOverviews,
  }
}
