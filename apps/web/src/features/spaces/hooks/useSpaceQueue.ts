import { useMemo } from 'react'
import { skipToken, type SkipToken, type SubscriptionOptions } from '@reduxjs/toolkit/query'
import {
  useSpaceTransactionsGetTransactionQueueV1Query,
  type SpaceQueueCounts,
  type SpaceQueuedItemPage,
  type SpaceQueueSafe,
  type SpaceTransactionsGetTransactionQueueV1ApiArg,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { isTransactionQueuedItem } from '@/utils/transaction-guards'

export type SpaceQueueItems = SpaceQueuedItemPage['results'][string][string]
export type SpaceQueueChain = { chainId: string; items: SpaceQueueItems }
export type SpaceQueueSection = { safeAddress: string; chains: SpaceQueueChain[] }

export const SPACE_QUEUE_STATUSES = ['execute', 'sign', 'blocked', 'waiting'] as const
export const SPACE_QUEUE_FLAGS = ['conflicting', 'stale'] as const
/** An option of the Status filter: a status, or a flag that narrows the chosen statuses */
export type SpaceQueueStatusOption = (typeof SPACE_QUEUE_STATUSES)[number] | (typeof SPACE_QUEUE_FLAGS)[number]

export type SpaceQueueFilters = {
  statuses: SpaceQueueStatusOption[]
  safes: SpaceQueueSafe[]
  chainIds: string[]
  /** Keeps the transactions still awaiting one of these signers */
  signers: string[]
}

export const NO_SPACE_QUEUE_FILTERS: SpaceQueueFilters = { statuses: [], safes: [], chainIds: [], signers: [] }

export const hasSpaceQueueFilters = (filters?: SpaceQueueFilters): boolean =>
  !!filters &&
  (filters.statuses.length > 0 || filters.safes.length > 0 || filters.chainIds.length > 0 || filters.signers.length > 0)

export type SpaceQueue = {
  sections: SpaceQueueSection[]
  /** Faceted: the status counts follow the Safe filter, `counts.safes` follows the Status filter */
  counts: SpaceQueueCounts
  /** Transactions in `sections` */
  shownCount: number
  /** Transactions in the whole queue, more than `shownCount` when the gateway capped the pages it read */
  totalCount: number
  /** Whether `sections` hold the whole queue; only known without filters or a search, which narrow it on purpose */
  isComplete: boolean
}

const toSpaceQueue = (page: SpaceQueuedItemPage, isNarrowed: boolean): SpaceQueue => {
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
    counts: page.counts,
    shownCount,
    totalCount,
    isComplete: isNarrowed || shownCount >= totalCount,
  }
}

type SpaceQueueArgs = { spaceId: string; filters?: SpaceQueueFilters; search?: string }

const joinOrOmit = (values: string[]): string | undefined => (values.length > 0 ? values.join(',') : undefined)

const toQueryArgs = ({ spaceId, filters = NO_SPACE_QUEUE_FILTERS, search }: SpaceQueueArgs) => {
  const statuses = filters.statuses.filter((option) => (SPACE_QUEUE_STATUSES as readonly string[]).includes(option))
  return {
    spaceId,
    status: statuses.length > 0 ? statuses : undefined,
    conflicting: filters.statuses.includes('conflicting') || undefined,
    stale: filters.statuses.includes('stale') || undefined,
    safes: joinOrOmit(filters.safes.map(({ chainId, safeAddress }) => `${chainId}:${safeAddress}`)),
    chainIds: joinOrOmit(filters.chainIds),
    signers: joinOrOmit(filters.signers),
    search: search || undefined,
  } satisfies SpaceTransactionsGetTransactionQueueV1ApiArg
}

/** The Space queue grouped by Safe and chain, read through the generated queue endpoint */
export const useSpaceQueue = (args: SpaceQueueArgs | SkipToken, options?: SubscriptionOptions) => {
  const result = useSpaceTransactionsGetTransactionQueueV1Query(
    args === skipToken ? skipToken : toQueryArgs(args),
    options,
  )
  const isNarrowed = args !== skipToken && (hasSpaceQueueFilters(args.filters) || !!args.search)
  const data = useMemo(() => result.data && toSpaceQueue(result.data, isNarrowed), [result.data, isNarrowed])
  const currentData = useMemo(
    () => result.currentData && toSpaceQueue(result.currentData, isNarrowed),
    [result.currentData, isNarrowed],
  )
  return { ...result, data, currentData }
}
