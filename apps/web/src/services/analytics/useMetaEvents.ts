import { useEffect, useMemo } from 'react'
import { gtmTrack } from '@/services/analytics/gtm'
import { TX_LIST_EVENTS, ASSETS_EVENTS } from './events'
import { selectQueuedTransactions } from '@/store/txQueueSlice'
import { useAppSelector } from '@/store'
import useChainId from '@/hooks/useChainId'
import useBalances from '@/hooks/useBalances'
import useSafeInfo from '@/hooks/useSafeInfo'
import useHiddenTokens from '@/hooks/useHiddenTokens'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'

// Track meta events on app load
const useMetaEvents = () => {
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()
  const isSpaceRoute = useIsSpaceRoute()

  // Queue size
  const queue = useAppSelector(selectQueuedTransactions)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const safeQueue = useMemo(() => queue, [safeAddress, queue !== undefined])
  useEffect(() => {
    if (!safeQueue || isSpaceRoute) return

    gtmTrack({
      ...TX_LIST_EVENTS.QUEUED_TXS,
      label: safeQueue.length.toString(),
    })
  }, [safeQueue, isSpaceRoute])

  // Tokens
  const { balances } = useBalances()
  const totalTokens = balances?.items.length ?? 0
  useEffect(() => {
    if (!safeAddress || totalTokens <= 0 || isSpaceRoute) return

    gtmTrack({ ...ASSETS_EVENTS.DIFFERING_TOKENS, label: totalTokens })
  }, [totalTokens, safeAddress, chainId, isSpaceRoute])

  // Manually hidden tokens
  const hiddenTokens = useHiddenTokens()
  const totalHiddenFromBalance =
    balances?.items.filter((item) => hiddenTokens.includes(item.tokenInfo.address)).length ?? 0

  useEffect(() => {
    if (!safeAddress || totalTokens <= 0 || isSpaceRoute) return

    gtmTrack({ ...ASSETS_EVENTS.HIDDEN_TOKENS, label: totalHiddenFromBalance })
  }, [safeAddress, totalHiddenFromBalance, totalTokens, isSpaceRoute])
}

export default useMetaEvents
