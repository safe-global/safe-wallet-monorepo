import { useEffect, useMemo, useState } from 'react'
import { useSelector, useStore } from 'react-redux'
import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import {
  cgwApi as spacesApi,
  useSpaceTransactionsGetTransactionQueueV1Query,
  type SpaceQueueCounts,
  type SpaceQueuedItemPage,
  type SpaceQueueSafe,
  type SpaceTransactionsGetTransactionQueueV1ApiArg,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { POLLING_INTERVAL } from '@/config/constants'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'
import type { RootState } from '@/store'
import { isTransactionQueuedItem } from '@/utils/transaction-guards'
import { selectSpaceQueuePolling, toSpaceQueueKey } from '../public/store/spaceQueuePollingSlice'

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
  /** Safes whose queue the gateway could not read, left out of `sections` */
  unavailableSafes: SpaceQueueSafe[]
}

export const toSpaceQueue = (page: SpaceQueuedItemPage, isNarrowed = false): SpaceQueue => {
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
    unavailableSafes: page.unavailableSafes,
  }
}

const REFETCH_EVENTS = [
  TxEvent.PROPOSED,
  TxEvent.SIGNATURE_PROPOSED,
  TxEvent.PROCESSED,
  TxEvent.SUCCESS,
  TxEvent.DELETED,
] as const

export type SpaceQueueQuery = { filters?: SpaceQueueFilters; search?: string }

const MAX_POLLING_INTERVAL = 5 * 60_000

/** Doubles the wait per failed poll, up to 5 minutes or the healthy interval when that is configured longer */
export const getPollingInterval = (failures: number, healthyInterval = POLLING_INTERVAL): number =>
  Math.min(healthyInterval * 2 ** failures, Math.max(MAX_POLLING_INTERVAL, healthyInterval))

const joinOrOmit = (values: string[]): string | undefined => (values.length > 0 ? values.join(',') : undefined)

const toQueryArgs = (spaceId: string, { filters = NO_SPACE_QUEUE_FILTERS, search }: SpaceQueueQuery) => {
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

/** The unfiltered Space queue as last loaded, which useSpaceQueuePolling keeps fresh; reading it sends no request */
export const selectSpaceQueuePage = (state: RootState, spaceId: string): SpaceQueuedItemPage | undefined => {
  const select = spacesApi.endpoints.spaceTransactionsGetTransactionQueueV1.select(toQueryArgs(spaceId, {}))
  // RootState types the shared gateway reducer without the spaces tags; the cache entries are the same
  return select(state as unknown as Parameters<typeof select>[0]).data
}

/** The Space queue grouped by Safe and chain, refetched after a tx event and, with `poll`, polled with backoff */
export const useSpaceQueue = (
  spaceId: string,
  query: SpaceQueueQuery = {},
  { skip = false, poll = false }: { skip?: boolean; poll?: boolean } = {},
) => {
  const store = useStore<RootState>()
  const args = toQueryArgs(spaceId, query)
  const queueKey = toSpaceQueueKey(args)
  const { data, currentData, isError, isFetching, requestId, refetch } = useSpaceTransactionsGetTransactionQueueV1Query(
    args,
    { skip },
  )
  const failures = useSelector((state: RootState) => selectSpaceQueuePolling(state, queueKey).failures)
  const isFocused = useSelector((state: RootState) => state[cgwClient.reducerPath].config.focused)
  const interval = getPollingInterval(failures)

  // A query that failed stays failed while Try again refetches it, so the error view doesn't flash other content
  const argsKey = JSON.stringify(args)
  const [failedArgsKey, setFailedArgsKey] = useState<string>()
  if (isError && !currentData && failedArgsKey !== argsKey) setFailedArgsKey(argsKey)
  if (currentData && failedArgsKey === argsKey) setFailedArgsKey(undefined)
  const isRetryingError = !isError && !currentData && !skip && failedArgsKey === argsKey
  const hasError = isError || isRetryingError

  // A second refetch of an entry already loading sends no request, so the page and the poller can both listen
  useEffect(() => {
    if (skip) return
    const unsubscribers = REFETCH_EVENTS.map((event) => txSubscribe(event, () => refetch()))
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [skip, refetch])

  // Not RTK Query's pollingInterval: it only ever reschedules sooner, so it can't back off
  useEffect(() => {
    if (skip || !poll || isFetching || !isFocused) return
    const timer = setInterval(() => {
      // Another view polling the same queue may have just asked for it
      const { lastStartedAt } = selectSpaceQueuePolling(store.getState(), queueKey)
      if (Date.now() - lastStartedAt >= interval) refetch()
    }, interval)
    return () => clearInterval(timer)
  }, [skip, poll, queueKey, isFetching, isFocused, interval, refetch, requestId, store])

  const isNarrowed = hasSpaceQueueFilters(query.filters) || !!query.search
  const currentQueue = useMemo(
    () => (currentData ? toSpaceQueue(currentData, isNarrowed) : undefined),
    [currentData, isNarrowed],
  )

  // The last queue loaded, kept with the Space and the query it answered
  const [lastQueue, setLastQueue] = useState<{ spaceId: string; query: SpaceQueueQuery; queue: SpaceQueue }>()
  if (currentQueue && lastQueue?.queue !== currentQueue) {
    setLastQueue({ spaceId, query, queue: currentQueue })
  }
  // While a new search or filter loads, the last queue stays on screen instead of a skeleton. Never another Space's
  const stale = !currentQueue && !skip && !hasError && lastQueue?.spaceId === spaceId ? lastQueue : undefined

  return {
    queue: currentQueue ?? stale?.queue,
    /** The query the returned queue answers: an earlier one while `isStale` */
    queueQuery: stale?.query ?? query,
    isStale: !!stale,
    // The last answer's counts stay while a new filter loads, so the menus keep them
    counts: data?.counts,
    isError: hasError,
    /** Try again is refetching a query that failed */
    isRetryingError,
    isFetching,
    isRefreshFailing: failures > 0,
    refetch,
  }
}
