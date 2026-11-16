import { useMemo } from 'react'
import type { SkipToken, SubscriptionOptions } from '@reduxjs/toolkit/query'
import {
  useSpaceTransactionsGetTransactionQueueV1Query,
  type SpaceQueuedItemPage,
  type SpaceQueueSafe,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { isTransactionQueuedItem } from '@/utils/transaction-guards'

export type SpaceQueueItems = SpaceQueuedItemPage['results'][string][string]
export type SpaceQueueChain = { chainId: string; items: SpaceQueueItems }
export type SpaceQueueSection = { safeAddress: string; chains: SpaceQueueChain[] }

export type SpaceQueue = {
  sections: SpaceQueueSection[]
  unavailableSafes: SpaceQueueSafe[]
  /** Transactions in `sections` */
  shownCount: number
  /** Transactions in the whole queue, more than `shownCount` when the gateway capped the pages it read */
  totalCount: number
  /** Whether `sections` hold the whole queue */
  isComplete: boolean
}

const toSpaceQueue = (page: SpaceQueuedItemPage): SpaceQueue => {
  const sections = Object.entries(page.results).map(([safeAddress, chainItems]) => ({
    safeAddress,
    chains: Object.entries(chainItems).map(([chainId, items]) => ({ chainId, items })),
  }))
  const shownCount = sections
    .flatMap((section) => section.chains)
    .reduce((count, chain) => count + chain.items.filter(isTransactionQueuedItem).length, 0)
  const totalCount = Math.max(page.count ?? shownCount, shownCount)

  return {
    sections,
    unavailableSafes: page.unavailableSafes,
    shownCount,
    totalCount,
    isComplete: shownCount >= totalCount,
  }
}

type SpaceQueueArgs = { spaceId: string }

/** The Space queue grouped by Safe and chain, read through the generated queue endpoint */
export const useSpaceQueue = (args: SpaceQueueArgs | SkipToken, options?: SubscriptionOptions) => {
  const result = useSpaceTransactionsGetTransactionQueueV1Query(args, options)
  const data = useMemo(() => result.data && toSpaceQueue(result.data), [result.data])
  const currentData = useMemo(() => result.currentData && toSpaceQueue(result.currentData), [result.currentData])
  return { ...result, data, currentData }
}
