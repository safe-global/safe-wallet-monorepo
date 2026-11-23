import { useMemo } from 'react'
import type { SafeItem } from '@safe-global/views/hooks/safes/types'
import type { SafeItemData } from '@safe-global/views/features/spaces/components/SafeSelectorDropdown/types'
import type { SafeScopeTarget } from '@safe-global/views/components/tx-flow/safe-scope/types'
import type { ChainInfo } from '@/features/spaces/public/types'
import { selectUndeployedSafes } from '@/features/counterfactual/public/store/undeployedSafesSlice'
import useChains from '@/hooks/useChains'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'
import useWallet from '@/hooks/wallets/useWallet'
import { useAppSelector } from '@/store'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import { selectCurrency } from '@/store/settingsSlice'
import { buildSingleChainItem, useResolveBalance } from './useSpaceSafeSelectorItems'

// Threshold and owners come from the overview (`isCurrentSafe` is false below), not the URL Safe
const NO_URL_SAFE = { threshold: 0 }

/**
 * The Safe bar's item for one fixed Safe — the Safe a Workspace tx flow acts on — built the same way
 * as the selector's own items, so the locked bar shows the same name, threshold and balance.
 */
export function useLockedSafeBarItem({ chainId, safeAddress }: SafeScopeTarget): {
  item: SafeItemData
  chain: ChainInfo
} {
  const { configs: chainConfigs } = useChains()
  const currency = useAppSelector(selectCurrency)
  const undeployedSafes = useAppSelector(selectUndeployedSafes)
  const { address: walletAddress } = useWallet() || {}
  const name = useSafeDisplayName(safeAddress, chainId)

  const safes = useMemo<SafeItem[]>(
    () => [{ chainId, address: safeAddress, isReadOnly: false, isPinned: false, lastVisited: 0, name }],
    [chainId, safeAddress, name],
  )

  const { data: overviews, isLoading: overviewsLoading } = useGetMultipleSafeOverviewsQuery({
    safes,
    currency,
    walletAddress,
  })
  const resolveBalance = useResolveBalance(safes, overviewsLoading)

  return useMemo(() => {
    const item = buildSingleChainItem(
      safes[0],
      false,
      overviews,
      resolveBalance,
      NO_URL_SAFE,
      chainConfigs,
      undeployedSafes,
      walletAddress,
    )
    return { item, chain: item.chains[0] }
  }, [safes, overviews, resolveBalance, chainConfigs, undeployedSafes, walletAddress])
}
