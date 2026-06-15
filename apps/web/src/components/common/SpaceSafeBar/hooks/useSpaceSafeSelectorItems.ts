import { useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useCurrentSpaceId } from '@/features/spaces'
import { isMultiChainSafeItem, flattenSafeItems } from '@/hooks/safes'
import type { SafeItem, MultiChainSafeItem } from '@/hooks/safes'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChainId from '@/hooks/useChainId'
import useChains from '@/hooks/useChains'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { useAppSelector } from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import { selectUndeployedSafes } from '@/features/counterfactual/store'
import { PendingSafeStatus } from '@/features/counterfactual/types'
import type { UndeployedSafesState } from '@/features/counterfactual/types'
import useWallet from '@/hooks/wallets/useWallet'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { skipToken } from '@reduxjs/toolkit/query'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import type { SafeItemData, SafeItemDataChain } from '@/features/spaces'
import type { ChainInfo } from '@/features/spaces/types'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { useSafeBarSafes } from './useSafeBarSafes'

const toChainInfo = (chainId: string, chain: Chain | undefined): ChainInfo => ({
  chainId,
  chainName: chain?.chainName ?? chainId,
  chainLogoUri: chain?.chainLogoUri ?? null,
  shortName: chain?.shortName ?? chainId,
})

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

const mapMultiChainItemChains = (
  chainConfigs: Chain[],
  chainIds: string[],
  item: MultiChainSafeItem,
  overviews: SafeOverview[] | undefined,
  overviewsLoading: boolean,
  undeployedSafes: UndeployedSafesState,
): SafeItemDataChain[] =>
  chainIds.map((id) => {
    const overview = overviews?.find((o) => sameAddress(o.address.value, item.address) && o.chainId === id)
    const perChainSafe = item.safes.find((s) => s.chainId === id)
    const undeployed = undeployedSafes[id]?.[item.address]
    return {
      ...toChainInfo(
        id,
        chainConfigs.find((c) => c.chainId === id),
      ),
      balance: overview?.fiatTotal,
      isLoading: overviewsLoading && !overview,
      queued: overview?.queued,
      isReadOnly: perChainSafe?.isReadOnly ?? false,
      isUndeployed: Boolean(undeployed),
      isActivating: Boolean(undeployed && undeployed.status.status !== PendingSafeStatus.AWAITING_EXECUTION),
    }
  })

function buildMultiChainItem(
  item: MultiChainSafeItem,
  isCurrentSafe: boolean,
  currentChainId: string,
  overviews: SafeOverview[] | undefined,
  overviewsLoading: boolean,
  safe: { threshold: number; owners?: { value: string }[] },
  chainConfigs: Chain[],
  undeployedSafes: UndeployedSafesState,
): SafeItemData {
  const chainIds = item.safes.map((s) => s.chainId)
  const orderedChainIds = isCurrentSafe ? [currentChainId, ...chainIds.filter((id) => id !== currentChainId)] : chainIds

  const currentChainOverview = overviews?.find(
    (o) => sameAddress(o.address.value, item.address) && o.chainId === currentChainId,
  )

  return {
    id: `${orderedChainIds[0]}:${item.address}`,
    name: item.name ?? '',
    address: item.address,
    ...resolveThresholdAndOwners(isCurrentSafe, safe, currentChainOverview),
    balance: currentChainOverview?.fiatTotal ?? '0',
    isLoading: overviewsLoading && !currentChainOverview,
    chains: mapMultiChainItemChains(chainConfigs, orderedChainIds, item, overviews, overviewsLoading, undeployedSafes),
  }
}

function buildSingleChainItem(
  item: SafeItem,
  isCurrentSafe: boolean,
  overviews: SafeOverview[] | undefined,
  overviewsLoading: boolean,
  safe: { threshold: number; owners?: { value: string }[] },
  chainConfigs: Chain[],
  undeployedSafes: UndeployedSafesState,
): SafeItemData {
  const overview = overviews?.find((o) => sameAddress(o.address.value, item.address) && o.chainId === item.chainId)
  const undeployed = undeployedSafes[item.chainId]?.[item.address]

  return {
    id: `${item.chainId}:${item.address}`,
    name: item.name ?? '',
    address: item.address,
    ...resolveThresholdAndOwners(isCurrentSafe, safe, overview),
    balance: overview?.fiatTotal ?? '0',
    isLoading: overviewsLoading && !overview,
    chains: mapChainIds(chainConfigs, [item.chainId]).map((chain) => ({
      ...chain,
      isReadOnly: item.isReadOnly ?? false,
      isUndeployed: Boolean(undeployed),
      isActivating: Boolean(undeployed && undeployed.status.status !== PendingSafeStatus.AWAITING_EXECUTION),
    })),
  }
}

export function useSpaceSafeSelectorItems() {
  const { dropdownSafes: allSafes } = useSafeBarSafes()
  const { safe, safeAddress: reduxSafeAddress } = useSafeInfo()
  const urlSafeAddress = useSafeAddressFromUrl()
  const effectiveSafeAddress = urlSafeAddress || reduxSafeAddress
  const currentChainId = useChainId()
  const { configs: chainConfigs } = useChains()
  const router = useRouter()
  const currency = useAppSelector(selectCurrency)
  const undeployedSafes = useAppSelector(selectUndeployedSafes)
  const { address: walletAddress } = useWallet() || {}
  const spaceId = useCurrentSpaceId()

  const flatSafes = useMemo(() => flattenSafeItems(allSafes), [allSafes])

  const {
    data: overviews,
    isLoading: overviewsLoading,
    isError: overviewsError,
    refetch: refetchOverviews,
  } = useGetMultipleSafeOverviewsQuery(flatSafes.length > 0 ? { safes: flatSafes, currency, walletAddress } : skipToken)

  const items: SafeItemData[] = useMemo(() => {
    return allSafes.map((item) => {
      const isCurrentSafe = sameAddress(item.address, effectiveSafeAddress)

      if (isMultiChainSafeItem(item)) {
        return buildMultiChainItem(
          item,
          isCurrentSafe,
          currentChainId,
          overviews,
          overviewsLoading,
          safe,
          chainConfigs,
          undeployedSafes,
        )
      }

      return buildSingleChainItem(item, isCurrentSafe, overviews, overviewsLoading, safe, chainConfigs, undeployedSafes)
    })
  }, [allSafes, effectiveSafeAddress, currentChainId, safe, overviews, overviewsLoading, chainConfigs, undeployedSafes])

  const selectedItemId = effectiveSafeAddress ? `${currentChainId}:${effectiveSafeAddress}` : ''

  const handleItemSelect = useCallback(
    (itemId: string) => {
      const colonIndex = itemId.indexOf(':')
      const chainId = itemId.slice(0, colonIndex)
      const address = itemId.slice(colonIndex + 1)
      const chain = chainConfigs.find((c) => c.chainId === chainId)
      if (!chain) return
      trackEvent(
        { ...SPACE_EVENTS.SAFE_SELECTED, label: spaceId ?? undefined },
        {
          workspace_id: spaceId,
          [MixpanelEventParams.SAFE_ADDRESS]: address,
          [MixpanelEventParams.CHAIN_ID]: chainId,
          source: 'space_selector',
        },
      )
      router.push({ pathname: AppRoutes.home, query: { safe: `${chain.shortName}:${address}` } })
    },
    [chainConfigs, router, spaceId],
  )

  const itemsNotReady = items.length === 0 && !overviewsError

  return {
    items,
    selectedItemId,
    handleItemSelect,
    isLoading: overviewsLoading || itemsNotReady,
    isError: overviewsError,
    refetch: refetchOverviews,
  }
}
