/**
 * Meta events tracking hook for the new analytics system.
 * Tracks business intelligence metrics on app load.
 */

import { useEffect, useMemo } from 'react'
import type { Analytics, SafeEventMap } from '@/services/analytics/core'
import { EVENT } from '@/services/analytics/events/catalog'
import { selectQueuedTransactions } from '@/store/txQueueSlice'
import { useAppSelector } from '@/store'
import useChainId from '@/hooks/useChainId'
import useBalances from '@/hooks/useBalances'
import useSafeInfo from '@/hooks/useSafeInfo'
import useHiddenTokens from '@/hooks/useHiddenTokens'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'

/**
 * Meta events tracking hook
 * Automatically tracks business intelligence metrics similar to legacy useMetaEvents
 */
const useMetaEvents = (analytics: Analytics<SafeEventMap> | null) => {
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()
  const isSpaceRoute = useIsSpaceRoute()

  // Queue size tracking (always call hooks, but guard usage)
  const queue = useAppSelector(selectQueuedTransactions)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const safeQueue = useMemo(() => queue, [safeAddress, queue !== undefined])
  useEffect(() => {
    if (!analytics || !safeQueue || isSpaceRoute) return

    analytics.track({
      name: EVENT.QueuedTransactions,
      payload: {
        count: safeQueue.length,
        safe_address: safeAddress,
        chain_id: chainId,
      },
    })
  }, [analytics, safeQueue, isSpaceRoute, safeAddress, chainId])

  // Token count tracking
  const { balances } = useBalances()
  const totalTokens = balances?.items.length ?? 0
  useEffect(() => {
    if (!analytics || !safeAddress || totalTokens <= 0 || isSpaceRoute) return

    analytics.track({
      name: EVENT.TokenCount,
      payload: {
        total: totalTokens,
        safe_address: safeAddress,
        chain_id: chainId,
      },
    })
  }, [analytics, totalTokens, safeAddress, chainId, isSpaceRoute])

  // Hidden tokens tracking
  const hiddenTokens = useHiddenTokens()
  const totalHiddenFromBalance =
    balances?.items.filter((item) => hiddenTokens.includes(item.tokenInfo.address)).length ?? 0

  useEffect(() => {
    if (!analytics || !safeAddress || totalTokens <= 0 || isSpaceRoute) return

    analytics.track({
      name: EVENT.HiddenTokens,
      payload: {
        count: totalHiddenFromBalance,
        safe_address: safeAddress,
        chain_id: chainId,
      },
    })
  }, [analytics, safeAddress, totalHiddenFromBalance, totalTokens, isSpaceRoute, chainId])
}

export default useMetaEvents
