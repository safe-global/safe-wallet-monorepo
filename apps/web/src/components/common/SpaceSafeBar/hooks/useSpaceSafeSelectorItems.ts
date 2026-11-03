import { useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useCurrentSpaceId } from '@/features/spaces'
import { isMultiChainSafeItem, flattenSafeItems } from '@/hooks/safes'
import type { SafeItem, MultiChainSafeItem, AllSafeItems } from '@/hooks/safes'
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
import { getOwnerAwaitingConfirmations } from '@/utils/transaction-guards'
import { skipToken } from '@reduxjs/toolkit/query'
import { AppRoutes } from '@/config/routes'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import type { SafeItemData, SafeItemDataChain } from '@/features/spaces'
import type { ChainInfo } from '@/features/spaces/types'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { usePortfolioSummaries } from '@/features/portfolio'
import { useSafeBarSafes } from './useSafeBarSafes'
import { withSpaceId } from '@/hooks/useUrlSpaceId'

type ResolveBalance = (
  chainId: string,
  address: string,
  overview: SafeOverview | undefined,
) => { balance: string | undefined; isLoading: boolean }

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

// Read-only is derived from the overview's owners (this surface fetches overviews for every listed
// safe anyway), so the bar never enumerates owned safes via the captcha-protected owners endpoint.
// No wallet → read-only; no overview (counterfactual safes) → the item's own flag, which is correct
// for CF safes even without the enumeration.
const deriveIsReadOnly = (
  overview: SafeOverview | undefined,
  walletAddress: string | undefined,
  fallback: boolean,
): boolean => {
  if (!walletAddress) return true
  if (!overview) return fallback
  return !overview.owners.some((owner) => sameAddress(owner.value, walletAddress))
}

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
  resolveBalance: ResolveBalance,
  undeployedSafes: UndeployedSafesState,
  walletAddress: string | undefined,
): SafeItemDataChain[] =>
  chainIds.map((id) => {
    const overview = overviews?.find((o) => sameAddress(o.address.value, item.address) && o.chainId === id)
    const perChainSafe = item.safes.find((s) => s.chainId === id)
    const undeployed = undeployedSafes[id]?.[item.address]
    const { balance, isLoading } = resolveBalance(id, item.address, overview)
    return {
      ...toChainInfo(
        id,
        chainConfigs.find((c) => c.chainId === id),
      ),
      threshold: overview?.threshold,
      owners: overview?.owners.length,
      balance,
      isLoading,
      queued: overview?.queued,
      awaitingConfirmation: getOwnerAwaitingConfirmations(overview, walletAddress) || undefined,
      isReadOnly: deriveIsReadOnly(overview, walletAddress, perChainSafe?.isReadOnly ?? false),
      isUndeployed: Boolean(undeployed),
      isActivating: Boolean(undeployed && undeployed.status.status !== PendingSafeStatus.AWAITING_EXECUTION),
    }
  })

function buildMultiChainItem(
  item: MultiChainSafeItem,
  isCurrentSafe: boolean,
  currentChainId: string,
  overviews: SafeOverview[] | undefined,
  resolveBalance: ResolveBalance,
  safe: { threshold: number; owners?: { value: string }[] },
  chainConfigs: Chain[],
  undeployedSafes: UndeployedSafesState,
  walletAddress: string | undefined,
): SafeItemData {
  const chainIds = item.safes.map((s) => s.chainId)
  const orderedChainIds = isCurrentSafe ? [currentChainId, ...chainIds.filter((id) => id !== currentChainId)] : chainIds

  const currentChainOverview = overviews?.find(
    (o) => sameAddress(o.address.value, item.address) && o.chainId === currentChainId,
  )
  const currentChainBalance = resolveBalance(currentChainId, item.address, currentChainOverview)

  return {
    id: `${orderedChainIds[0]}:${item.address}`,
    name: item.name ?? '',
    address: item.address,
    ...resolveThresholdAndOwners(isCurrentSafe, safe, currentChainOverview),
    balance: currentChainBalance.balance ?? '0',
    isLoading: currentChainBalance.isLoading,
    chains: mapMultiChainItemChains(
      chainConfigs,
      orderedChainIds,
      item,
      overviews,
      resolveBalance,
      undeployedSafes,
      walletAddress,
    ),
  }
}

function buildSingleChainItem(
  item: SafeItem,
  isCurrentSafe: boolean,
  overviews: SafeOverview[] | undefined,
  resolveBalance: ResolveBalance,
  safe: { threshold: number; owners?: { value: string }[] },
  chainConfigs: Chain[],
  undeployedSafes: UndeployedSafesState,
  walletAddress: string | undefined,
): SafeItemData {
  const overview = overviews?.find((o) => sameAddress(o.address.value, item.address) && o.chainId === item.chainId)
  const undeployed = undeployedSafes[item.chainId]?.[item.address]
  const { balance, isLoading } = resolveBalance(item.chainId, item.address, overview)

  return {
    id: `${item.chainId}:${item.address}`,
    name: item.name ?? '',
    address: item.address,
    ...resolveThresholdAndOwners(isCurrentSafe, safe, overview),
    balance: balance ?? '0',
    isLoading,
    chains: mapChainIds(chainConfigs, [item.chainId]).map((chain) => ({
      ...chain,
      queued: overview?.queued,
      awaitingConfirmation: getOwnerAwaitingConfirmations(overview, walletAddress) || undefined,
      isReadOnly: deriveIsReadOnly(overview, walletAddress, item.isReadOnly ?? false),
      isUndeployed: Boolean(undeployed),
      isActivating: Boolean(undeployed && undeployed.status.status !== PendingSafeStatus.AWAITING_EXECUTION),
    })),
  }
}

/** The two lists of the Safe selector: the Workspace of the URL, and My accounts. */
export type DropdownTab = 'workspace' | 'local'

export function useSpaceSafeSelectorItems() {
  const { workspaceSafes, localSafes, isInSpaceContext } = useSafeBarSafes()
  // Union feeds the overview query once; the two lists are mapped to items separately for the tabs.
  const allSafes = useMemo(() => [...workspaceSafes, ...localSafes], [workspaceSafes, localSafes])
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

  const summaries = usePortfolioSummaries(flatSafes, FEATURES.PORTFOLIO_SUMMARIES_SELECTOR)

  // A Safe missing from the summaries response falls back to its overview rather than showing $0
  const resolveBalance = useCallback<ResolveBalance>(
    (chainId, address, overview) => {
      if (summaries.isEnabled(chainId)) {
        const summary = summaries.getSummary(chainId, address)
        if (summary) return { balance: summary.fiatTotal, isLoading: false }
        if (summaries.isLoading) return { balance: undefined, isLoading: true }
      }
      return { balance: overview?.fiatTotal, isLoading: overviewsLoading && !overview }
    },
    [summaries, overviewsLoading],
  )

  const buildItems = useCallback(
    (safes: AllSafeItems): SafeItemData[] =>
      safes.map((item) => {
        const isCurrentSafe = sameAddress(item.address, effectiveSafeAddress)

        if (isMultiChainSafeItem(item)) {
          return buildMultiChainItem(
            item,
            isCurrentSafe,
            currentChainId,
            overviews,
            resolveBalance,
            safe,
            chainConfigs,
            undeployedSafes,
            walletAddress,
          )
        }

        return buildSingleChainItem(
          item,
          isCurrentSafe,
          overviews,
          resolveBalance,
          safe,
          chainConfigs,
          undeployedSafes,
          walletAddress,
        )
      }),
    [
      effectiveSafeAddress,
      currentChainId,
      safe,
      overviews,
      resolveBalance,
      chainConfigs,
      undeployedSafes,
      walletAddress,
    ],
  )

  const workspaceItems = useMemo(() => buildItems(workspaceSafes), [buildItems, workspaceSafes])
  const localItems = useMemo(() => buildItems(localSafes), [buildItems, localSafes])
  // Back-compat: the "active" list matches the pre-tabs behaviour (space vs local by context).
  const items = isInSpaceContext ? workspaceItems : localItems

  const selectedItemId = effectiveSafeAddress ? `${currentChainId}:${effectiveSafeAddress}` : ''

  // A Safe from the Workspace tab opens in that Workspace; one from My accounts opens outside it.
  const handleItemSelect = useCallback(
    (itemId: string, tab: DropdownTab) => {
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
      router.push({
        pathname: AppRoutes.home,
        query: withSpaceId({ safe: `${chain.shortName}:${address}` }, tab === 'workspace' ? spaceId : null),
      })
    },
    [chainConfigs, router, spaceId],
  )

  const itemsNotReady = workspaceItems.length === 0 && localItems.length === 0 && !overviewsError

  return {
    items,
    workspaceItems,
    localItems,
    selectedItemId,
    handleItemSelect,
    isLoading: overviewsLoading || itemsNotReady,
    isError: overviewsError,
    refetch: refetchOverviews,
    isInSpaceContext,
    hasWallet: Boolean(walletAddress),
  }
}
