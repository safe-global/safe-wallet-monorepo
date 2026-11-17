import { useMemo } from 'react'
import {
  useSpaceTransactionsGetTransactionQueueV1Query,
  type SpaceQueuedItemPage,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { isTransactionQueuedItem } from '@/utils/transaction-guards'

export type SpaceQueueItems = SpaceQueuedItemPage['results'][string][string]
export type SpaceQueueChain = { chainId: string; items: SpaceQueueItems }
export type SpaceQueueSection = { safeAddress: string; chains: SpaceQueueChain[] }

export type SpaceQueue = {
  sections: SpaceQueueSection[]
  /** Transactions in `sections` */
  shownCount: number
  /** Transactions in the whole queue, more than `shownCount` when the gateway capped the pages it read */
  totalCount: number
  /** Whether `sections` hold the whole queue */
  isComplete: boolean
}

export const toSpaceQueue = (page: SpaceQueuedItemPage): SpaceQueue => {
  const sections = Object.entries(page.results).map(([safeAddress, chainItems]) => ({
    safeAddress,
    chains: Object.entries(chainItems).map(([chainId, items]) => ({ chainId, items })),
  }))
  const shownCount = sections
    .flatMap((section) => section.chains)
    .reduce((count, chain) => count + chain.items.filter(isTransactionQueuedItem).length, 0)
  const totalCount = Math.max(page.count ?? shownCount, shownCount)

  return { sections, shownCount, totalCount, isComplete: shownCount >= totalCount }
}

export const useSpaceQueue = (spaceId: string) => {
  const { currentData, isError, refetch } = useSpaceTransactionsGetTransactionQueueV1Query({ spaceId })
  const queue = useMemo(() => (currentData ? toSpaceQueue(currentData) : undefined), [currentData])
  return { queue, isError, refetch }
}
