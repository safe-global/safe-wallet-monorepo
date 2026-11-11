import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import type {
  SpaceQueueCounts,
  SpaceQueuedItemPage,
  SpaceQueueSafe,
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
  unavailableSafes: SpaceQueueSafe[]
  /** Faceted: the status counts follow the Safe filter, `counts.safes` follows the Status filter */
  counts: SpaceQueueCounts
  /** Transactions in `sections` */
  shownCount: number
  /** Transactions in the whole queue, more than `shownCount` when the gateway capped the pages it read */
  totalCount: number
  /** Whether `sections` hold the whole queue; only known without filters, which narrow it on purpose */
  isComplete: boolean
}

const toSpaceQueue = (page: SpaceQueuedItemPage, filters?: SpaceQueueFilters, search?: string): SpaceQueue => {
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
    counts: page.counts,
    shownCount,
    totalCount,
    isComplete: hasSpaceQueueFilters(filters) || !!search || shownCount >= totalCount,
  }
}

type SpaceQueueArgs = { spaceId: string; filters?: SpaceQueueFilters; search?: string }

const joinOrOmit = (values: string[]): string | undefined => (values.length > 0 ? values.join(',') : undefined)

const toParams = ({ filters, search }: SpaceQueueArgs) => {
  if (!filters || !hasSpaceQueueFilters(filters)) return search ? { search } : undefined
  const statuses = filters.statuses.filter((option) => (SPACE_QUEUE_STATUSES as readonly string[]).includes(option))
  return {
    search,
    status: joinOrOmit(statuses),
    conflicting: filters.statuses.includes('conflicting') || undefined,
    stale: filters.statuses.includes('stale') || undefined,
    safes: joinOrOmit(filters.safes.map(({ chainId, safeAddress }) => `${chainId}:${safeAddress}`)),
    chainIds: joinOrOmit(filters.chainIds),
    signers: joinOrOmit(filters.signers),
  }
}

// Built on cgwClient, not the generated spaces api, which many tests replace with a partial mock
export const spaceQueueApi = cgwClient.enhanceEndpoints({ addTagTypes: ['transactions'] }).injectEndpoints({
  endpoints: (build) => ({
    getSpaceQueue: build.query<SpaceQueue, SpaceQueueArgs>({
      query: (args) => ({
        url: `/v1/spaces/${args.spaceId}/transactions/queued`,
        params: toParams(args),
      }),
      transformResponse: (page: SpaceQueuedItemPage, _meta, { filters, search }) => toSpaceQueue(page, filters, search),
      providesTags: ['transactions'],
    }),
  }),
})

export const { useGetSpaceQueueQuery } = spaceQueueApi
